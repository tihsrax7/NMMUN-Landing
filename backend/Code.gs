/**
 * NMMUN'27 registrations -> Google Sheet.
 * This small Google Apps Script receives the form sent by the landing page
 * and adds one row to the sheet it is attached to.
 * Setup steps are in backend/README.md.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Time", "Name", "Email", "School or college", "Country", "Committee"]);
  }
  var p = e.parameter;
  sheet.appendRow([new Date(), clean(p.name), clean(p.email), clean(p.college), clean(p.country), clean(p.committee)]);
  return ContentService.createTextOutput("ok");
}

// Keep entries short, and stop a value being read as a spreadsheet formula.
function clean(value) {
  var text = String(value || "").slice(0, 100);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
