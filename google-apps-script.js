// ── Terratjo Portal → Google Sheets Integration ──────────────────
// Paste this entire file into Google Apps Script (Extensions > Apps Script)
// Then: Deploy > New Deployment > Web App > Anyone > Deploy

const SHEET_NAME = 'Bookings'; // Name of the sheet tab

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create sheet if it doesn't exist
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 13).setValues([[
        'Booking ID', 'Guest Name', 'Email', 'Phone', 'Address',
        'Room', 'Check-in', 'Check-out', 'Guests',
        'Total (IDR)', 'Status', 'Notes', 'Last Updated'
      ]]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const row = [
      data.id || '',
      data.guestName || '',
      data.guestEmail || '',
      data.phone || '',
      data.address || '',
      data.room || '',
      data.checkin || '',
      data.checkout || '',
      data.numGuests || 1,
      data.total || 0,
      data.status || '',
      data.notes || '',
      new Date().toLocaleString('id-ID')
    ];

    if (data.action === 'create') {
      sheet.appendRow(row);
    } else if (data.action === 'update' || data.action === 'cancel') {
      // Find existing row by Booking ID and update it
      const values = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          sheet.getRange(i + 1, 1, 1, 13).setValues([row]);
          found = true;
          break;
        }
      }
      // If not found, add as new row
      if (!found) sheet.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this manually to verify the sheet is set up correctly
function testSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  Logger.log('Sheet ready: ' + sheet.getName());
}
