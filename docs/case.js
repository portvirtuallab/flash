// ONE source of truth for every reference document in /docs.
// Change a value here and every document (invoice, EUR.1, shipping instructions, data sheet,
// quotation, letter, report template) shows the new value. Dates are offsets in days from
// the day the page is opened.
// All companies, people, numbers and IDs are fictional (Port Virtual Lab training case).
window.CASE = {
  exporter: {
    name: 'Tecnomaq S.A.',
    unit: 'Cairo Branch — Export Department',
    street: '12 El-Tahrir Square, Qasr El Nil',
    city: 'Cairo Governorate 4272077',
    country: 'Egypt',
    taxId: 'EG-TRN 245-631-798',
    phone: '+20 2 1234 5678',
    email: 'export@tecnomaq.example',
    web: 'www.tecnomaq.example',
    hq: "Head office: Avinguda del Carrilet, 45, 08902 L'Hospitalet de Llobregat (Barcelona), Spain",
    bank: 'PLAYTRADEBANK — Cairo',
    iban: 'EG38 0019 0005 0000 0000 2631 8000 2',
    swift: 'PLTBEGCXXXX'
  },
  consignee: {
    name: 'Attrezzature Industriali Bari S.p.A.',
    street: 'Via Gaetano Salvemini, 69',
    city: '70125 Bari (BA)',
    country: 'Italy',
    vat: 'IT 12345678901',
    eori: 'IT12345678901'
  },
  forwarder: {
    name: 'PLAYFORWARDING BARCELONA',
    street: 'Moll de Barcelona s/n, Terminal Drassanes',
    city: '08039 Barcelona',
    country: 'Spain',
    contact: 'Laura Puig — Sea Freight Sales',
    email: 'sales@playforwarding.example'
  },
  manager: { name: 'Joan Malkovich', role: 'General Manager' },

  goods: {
    ref: 'WS-007',
    name: 'Tecnomaq LT-2000 CNC Milling Machine',
    description: 'High-precision CNC milling machine for industrial use (automotive, aerospace and precision engineering).',
    hs: '8459.61',
    hsText: 'Milling machines for working metal, numerically controlled',
    origin: 'Egypt',
    qty: 1,
    unitPrice: 120000,
    currency: 'EUR',
    machine: { l: 2.00, w: 1.50, h: 2.00, kg: 2000 },  // metres, kilograms
    box: { l: 2.38, w: 1.90, h: 2.20, kg: 744 },       // wooden box: outer size and tare
    packages: '1 wooden box (crate)',
    marks: 'TECNOMAQ / AIB-BARI / VT2409257 / 1-1',
    dangerous: 'Not dangerous goods — not subject to IMDG / ADR / IATA DGR'
  },

  shipment: {
    incoterm: 'DAP',
    incotermPlace: 'Bari, Italy (consignee warehouse)',
    incotermVersion: 'Incoterms® 2020',
    invoiceNo: 'VT2409257',
    euro1No: 'A 000000 (specimen)',
    shippingNo: 'TRK123456789IT',
    bookingRef: 'SDG02356701',
    portsOfLoading: 'Port Said (EGPSD) or Damietta (EGDAM) — as per the route selected by the Export Department',
    destinationLocode: 'ITBRI',
    destinationPort: 'Bari, Italy',
    payment: 'Bank transfer, 90 days from invoice date',
    driver: 'Xavier',
    truckPlate: '2006SDG'
  },

  // PlayForwarding reference quotation
  quote: {
    number: '2937',
    customerRef: '66622441EFNOW',
    pol: 'DUMYAT (DAMIETTA)',
    pod: 'CIVITAVECCHIA',
    term: 'CIP CIVITAVECCHIA',
    equipment: '40 FEET CONTAINER FCL',
    cbm: 10.03,
    amount: 4900
  },

  // Day offsets from "today" (the day the document is opened)
  dates: {
    letter: -1,
    invoice: -7,
    euro1: -7,
    shipping: 3,
    quoteOffer: -10,
    quoteValidUntil: -40,
    report: 0
  }
};
