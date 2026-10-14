/**
 * PVL.ONE — Intermodal Transport Mission
 * Apps Script Web App (HtmlService) — no CORS.
 *
 * DEPLOYMENT:
 *  1. Open script.google.com > New project.
 *  2. Paste this file as Code.gs and create an HTML file named "Index".
 *  3. Adjust the constants below (SHEET_ID and sheet names) if needed.
 *  4. Project Settings > Script Properties: add
 *       ERP_USER  = shared ERP initial-login username
 *       ERP_PASS  = shared ERP initial-login password
 *     (kept out of the code so they never reach the public repository).
 *  5. Deploy > New deployment > Web app.
 *       - Execute as: Me.
 *       - Who has access: Anyone / Anyone with a Google account.
 *  6. Copy the /exec URL and share it with the teams.
 *
 * The same Spreadsheet contains:
 *   - TEAMS sheet (the one you already use, "Sheet2"): columns A..I as in the original file.
 *   - RESULTS sheet ("Results"): automatically created if it does not exist.
 */

// ====== CONSTANTS ======
const SHEET_ID = '1duKwj35SUknLsuHsZ2Pn75j6qIdnPAv0jHMm7vD1n_Y';
const TEAMS_SHEET = 'Sheet2';     // existing teams sheet
const RESULTS_SHEET = 'Results';  // results sheet, automatically created

// ====== WEB APP ENTRY POINT ======
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('PVL.ONE — Intermodal Transport Mission')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ====== LOGIN: returns team data by code (column H = index 7) ======
function getTeamData(teamCode) {
  teamCode = String(teamCode).trim();

  if (!/^\d{4}$/.test(teamCode)) {
    return {
      ok: false,
      error: 'The code must contain exactly 4 digits.'
    };
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TEAMS_SHEET);

  if (!sheet) {
    return {
      ok: false,
      error: 'The teams sheet was not found.'
    };
  }

  const data = sheet.getDataRange().getValues();

  // Normalizes a cell value into a clean code.
  // The spreadsheet may store "3008.0" as number 3008.
  const norm = function (value) {
    if (value == null || value === '') return '';

    if (typeof value === 'number') {
      return String(Math.round(value)); // 3008.0 -> "3008"
    }

    return String(value).trim().replace(/\.0+$/, ''); // "3008.0" -> "3008"
  };

  const props = PropertiesService.getScriptProperties();

  // Search team code in column H (index 7).
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (norm(row[7]) === teamCode) {
      return {
        ok: true,
        team: {
          teamName: row[0] || 'Team',
          userClickCargo: row[1] || '',
          passClickCargo: row[2] || '',
          urlClickCargo: row[3] || '',
          email: row[4] || '',
          emailPass: row[5] || '',
          urlEmail: row[6] || '',
          teamCode: teamCode,
          pvlPin: norm(row[8]),
          erpUser: props.getProperty('ERP_USER') || '',
          erpPass: props.getProperty('ERP_PASS') || ''
        }
      };
    }
  }

  return {
    ok: false,
    error: 'Team code not found. Please check the code.'
  };
}

// ====== SAVE RESULT: incremental save, called after each task submission ======
function saveResult(payload) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(RESULTS_SHEET);

    if (!sheet) {
      sheet = ss.insertSheet(RESULTS_SHEET);

      sheet.appendRow([
        'Timestamp',
        'Team',
        'Code',
        'Event',
        'Event Points',
        'Total Score',
        'Details / Feedback',
        'Elapsed Time'
      ]);

      sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      payload.teamName || '',
      payload.teamCode || '',
      payload.event || '',
      payload.points != null ? payload.points : '',
      payload.totalScore != null ? payload.totalScore : '',
      payload.feedback || '',
      payload.elapsed || ''
    ]);

    return { ok: true };

  } catch (error) {
    return {
      ok: false,
      error: String(error)
    };
  }
}
