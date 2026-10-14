/**
 * PVL.ONE — Intermodal Transport Mission
 * Apps Script JSON API used by the front end published on GitHub Pages (index.html).
 *
 * The server is the single source of truth: it grades the answers, keeps each team's
 * progress (State sheet), enforces the countdown and logs every event (Results sheet).
 * Answers and hints are NOT in this file (the repository is public): they live in the
 * MISSION_KEY script property.
 *
 * DEPLOYMENT:
 *  1. Open script.google.com > New project and paste this file as Code.gs
 *     (no HTML file is needed: the page is served by GitHub Pages).
 *  2. Project Settings > Script Properties:
 *       ERP_USER    = shared ERP initial-login username
 *       ERP_PASS    = shared ERP initial-login password
 *       MISSION_KEY = full contents of mission-key.json (kept outside the repository)
 *  3. Deploy > New deployment > Web app.
 *       - Execute as: Me.
 *       - Who has access: Anyone   (required so the GitHub Pages site can call it).
 *  4. Copy the /exec URL into config.js (apiUrl) and push.
 *
 * The same Spreadsheet contains:
 *   - TEAMS sheet ("Sheet2"): columns A..I as in the original file.
 *   - RESULTS sheet ("Results"): event log, automatically created.
 *   - STATE sheet ("State"): progress per team, automatically created.
 *     To run the activity again with the same codes, run resetAllProgress() from the editor.
 */

// ====== CONSTANTS ======
const SHEET_ID = '1duKwj35SUknLsuHsZ2Pn75j6qIdnPAv0jHMm7vD1n_Y';
const TEAMS_SHEET = 'Sheet2';     // existing teams sheet
const RESULTS_SHEET = 'Results';  // results log, automatically created
const STATE_SHEET = 'State';      // team progress, automatically created

const MISSION_SECONDS = 5400;              // 1:30:00
const DEADLINE_GRACE_MS = 30 * 1000;       // tolerance for requests sent right at the end
const HINT_COST = 3;
const MAX_FAILED_CODES_PER_MIN = 15;       // anti brute force on the 4-digit team codes
const TASK_IDS = ['task1', 'task2', 'task3', 'task4', 'task5'];

// ====== WEB APP ENTRY POINTS ======
function doGet() {
  return json_({ ok: true, service: 'PVL.ONE mission API' });
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Invalid request.' });
  }
  try {
    return json_(handle_(req));
  } catch (err) {
    return json_({ ok: false, error: 'Server error: ' + err.message });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====== REQUEST HANDLING ======
function handle_(req) {
  const action = String(req.action || '');
  const code = String(req.code || '').trim();

  if (!/^\d{4}$/.test(code)) {
    return { ok: false, error: 'The code must contain exactly 4 digits.' };
  }

  // Throttle: after too many unknown codes in a minute, every request is refused for a minute,
  // so the 10,000 possible codes cannot be enumerated.
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('pvl_failed_codes') || 0);
  if (fails >= MAX_FAILED_CODES_PER_MIN) {
    return { ok: false, error: 'Too many failed attempts. Wait one minute and try again.' };
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const team = findTeam_(ss, code);
  if (!team) {
    cache.put('pvl_failed_codes', String(fails + 1), 60);
    return { ok: false, error: 'Team code not found. Please check the code.' };
  }

  const handler = ACTIONS[action];
  if (!handler) return { ok: false, error: 'Unknown action.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const store = stateStore_(ss);
    const st = store.load(code, team.teamName);
    const out = handler(st, req) || {};
    const res = { serverNow: Date.now() };

    if (out.error) {
      res.ok = false;
      res.error = out.error;
    } else {
      if (out.log) {
        store.save(st);
        logResult_(ss, team, st, out.log);
        SpreadsheetApp.flush();
      }
      res.ok = true;
      Object.assign(res, out.data || {});
    }
    if (action === 'login') res.team = team;
    res.state = st;
    return res;
  } finally {
    lock.releaseLock();
  }
}

const ACTIONS = {
  login: function () {
    return {};
  },

  start: function (st) {
    if (st.startTime) return {};
    st.startTime = Date.now();
    st.deadline = st.startTime + MISSION_SECONDS * 1000;
    return { log: { event: 'START', points: 0, feedback: 'Mission started' } };
  },

  submit: function (st, req) {
    const err = guard_(st);
    if (err) return { error: err };
    const taskId = String(req.taskId || '');
    if (TASK_IDS.indexOf(taskId) < 0) return { error: 'Unknown task.' };
    if (st.tasks[taskId]) return { error: 'This task has already been submitted.' };

    const r = gradeTask_(missionKey_().tasks[taskId], req.answers || {});
    st.tasks[taskId] = { points: r.points, feedback: r.feedback };
    st.totalScore += r.points;
    st.badges.first = true;
    r.badges.forEach(function (b) { st.badges[b] = true; });
    if (r.allCorrect && r.points > 0) {
      st.streak++;
      if (st.streak >= 3) st.badges.streak = true;
    } else {
      st.streak = 0;
    }
    return {
      log: { event: taskId, points: r.points, feedback: r.feedback.join('; ') },
      data: { result: st.tasks[taskId] }
    };
  },

  hint: function (st, req) {
    const err = guard_(st);
    if (err) return { error: err };
    const taskId = String(req.taskId || '');
    const text = missionKey_().hints[taskId];
    if (!text) return { error: 'Unknown task.' };
    if (st.tasks[taskId]) return { error: 'This task has already been submitted.' };

    // No floor at 0: a hint always costs its points, even if the score goes negative.
    st.totalScore -= HINT_COST;
    st.hintsUsed++;
    return {
      log: { event: 'hint:' + taskId, points: -HINT_COST, feedback: 'Hint used in ' + taskId },
      data: { hint: text }
    };
  },

  quiz: function (st, req) {
    const err = guard_(st);
    if (err) return { error: err };
    if (st.quiz) return { error: 'The bonus quiz has already been submitted.' };

    const r = gradeQuiz_(missionKey_().quiz, req.answers || {});
    st.quiz = r;
    st.totalScore += r.points;
    if (r.points === r.max) st.badges.quiz = true;
    return {
      log: { event: 'bonusQuiz', points: r.points, feedback: r.feedback.join('; ') },
      data: { result: r }
    };
  },

  finish: function (st) {
    if (!st.startTime) return { error: 'Start the mission first.' };
    if (st.finished) return {};
    if (st.hintsUsed === 0) st.badges.nohint = true;
    st.badges.finisher = true;
    st.finished = true;
    st.finishedAt = Date.now();
    const done = Object.keys(st.tasks).length;
    return {
      log: {
        event: 'FINAL',
        points: st.totalScore,
        feedback: 'Completed ' + done + '/5 tasks · Badges: ' + (Object.keys(st.badges).join(', ') || 'none')
      }
    };
  }
};

function guard_(st) {
  if (!st.startTime) return 'Start the mission first.';
  if (st.finished) return 'The mission has already been completed.';
  if (Date.now() > st.deadline + DEADLINE_GRACE_MS) return 'Time is up.';
  return null;
}

// ====== GRADING (answer key comes from the MISSION_KEY script property) ======
function missionKey_() {
  const raw = PropertiesService.getScriptProperties().getProperty('MISSION_KEY');
  if (!raw) throw new Error('MISSION_KEY script property is not set.');
  return JSON.parse(raw);
}

function parseNum_(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return parseFloat(s);
}

function gradeTask_(items, answers) {
  const radios = answers.radios || {};
  const values = answers.values || [];
  let points = 0, allCorrect = true;
  const feedback = [], badges = [];

  items.forEach(function (it) {
    if (it.type === 'note') { feedback.push(it.text); return; }
    let ok;
    if (it.type === 'radio') {
      ok = radios[it.name] === it.answer;
    } else if (it.type === 'range') {
      const v = parseNum_(values[it.index]);
      ok = !isNaN(v) && v >= it.min && v <= it.max;
    } else {
      ok = true; // 'always'
    }
    if (ok) {
      points += it.pts;
      feedback.push('✅ ' + it.ok);
      if (it.badge) badges.push(it.badge);
    } else {
      feedback.push('❌ ' + it.ko);
      allCorrect = false;
    }
  });

  return { points: points, feedback: feedback, allCorrect: allCorrect, badges: badges };
}

function gradeQuiz_(key, answers) {
  const names = Object.keys(key);
  let points = 0;
  const feedback = [];

  names.forEach(function (name, i) {
    const expected = key[name];
    const given = answers[name];
    let ok;
    if (Array.isArray(expected)) {
      const sel = Array.isArray(given) ? given : [];
      ok = sel.length === expected.length && sel.every(function (v) { return expected.indexOf(v) >= 0; });
    } else {
      ok = given === expected;
    }
    if (ok) { points++; feedback.push('✅ P' + (i + 1) + ': correct'); }
    else feedback.push('❌ P' + (i + 1) + ': incorrect or unanswered');
  });

  return { points: points, max: names.length, feedback: feedback };
}

// ====== TEAMS: lookup by code (column H = index 7) ======
function findTeam_(ss, teamCode) {
  const sheet = ss.getSheetByName(TEAMS_SHEET);
  if (!sheet) throw new Error('The teams sheet was not found.');
  const data = sheet.getDataRange().getValues();
  const props = PropertiesService.getScriptProperties();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (norm_(row[7]) === teamCode) {
      return {
        teamName: String(row[0] || 'Team'),
        userClickCargo: row[1] || '',
        passClickCargo: row[2] || '',
        urlClickCargo: row[3] || '',
        email: row[4] || '',
        emailPass: row[5] || '',
        urlEmail: row[6] || '',
        teamCode: teamCode,
        pvlPin: norm_(row[8]),
        erpUser: props.getProperty('ERP_USER') || '',
        erpPass: props.getProperty('ERP_PASS') || ''
      };
    }
  }
  return null;
}

// Normalizes a cell value into a clean code.
// The spreadsheet may store "3008.0" as number 3008.
function norm_(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return String(Math.round(value)); // 3008.0 -> "3008"
  return String(value).trim().replace(/\.0+$/, '');                // "3008.0" -> "3008"
}

// ====== STATE: one row per team, full state as JSON in the last column ======
function stateStore_(ss) {
  let sheet = ss.getSheetByName(STATE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(STATE_SHEET);
    sheet.getRange('A:A').setNumberFormat('@'); // keep codes like "0123" as text
    sheet.appendRow(['Code', 'Team', 'Total Score', 'Tasks done', 'Quiz', 'Hints', 'Started', 'Finished', 'Updated', 'State (do not edit)']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  let rowIndex = null;
  return {
    load: function (code, teamName) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (norm_(data[i][0]) === code && data[i][9]) {
          rowIndex = i + 1;
          return JSON.parse(data[i][9]);
        }
      }
      rowIndex = null;
      return {
        code: code, teamName: teamName, startTime: null, deadline: null,
        totalScore: 0, tasks: {}, quiz: null, hintsUsed: 0, streak: 0,
        badges: {}, finished: false, finishedAt: null
      };
    },
    save: function (st) {
      const row = [
        st.code, st.teamName, st.totalScore, Object.keys(st.tasks).length,
        st.quiz ? st.quiz.points : '', st.hintsUsed,
        st.startTime ? new Date(st.startTime) : '', st.finished ? 'Yes' : '',
        new Date(), JSON.stringify(st)
      ];
      if (rowIndex) {
        sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
        rowIndex = sheet.getLastRow();
      }
    }
  };
}

// ====== RESULTS LOG ======
function logResult_(ss, team, st, entry) {
  let sheet = ss.getSheetByName(RESULTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(RESULTS_SHEET);
    sheet.appendRow(['Timestamp', 'Team', 'Code', 'Event', 'Event Points', 'Total Score', 'Details / Feedback', 'Elapsed Time']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date(), team.teamName, team.teamCode, entry.event,
    entry.points, st.totalScore, entry.feedback || '', elapsed_(st)
  ]);
}

function elapsed_(st) {
  if (!st.startTime) return '0:00';
  const e = Math.floor(((st.finishedAt || Date.now()) - st.startTime) / 1000);
  const h = Math.floor(e / 3600), m = Math.floor((e % 3600) / 60), s = e % 60;
  const pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
}

// ====== TRAINER UTILITIES (run from the Apps Script editor) ======
/** Deletes every team's progress so the activity can be run again. The Results log is kept. */
function resetAllProgress() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STATE_SHEET);
  if (sheet && sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
}
