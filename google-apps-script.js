// ── Terratjo Portal → Google Sheets Integration ──────────────────
// Paste this entire file into Google Apps Script (Extensions > Apps Script)
// Then: Deploy > New Deployment > Web App > Anyone > Deploy

const SHEET_NAME = 'Bookings'; // Name of the sheet tab
const DRIVE_FOLDER_ID = '1Ls0zNyBmi8v8vVHAG_Nt99SlycTbg1VO'; // Drive folder for payment proofs

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create sheet if it doesn't exist
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add headers (15 columns now)
      sheet.getRange(1, 1, 1, 15).setValues([[
        'Booking ID', 'Guest Name', 'Email', 'Phone', 'Address',
        'Room', 'Check-in', 'Check-out', 'Guests',
        'Total (IDR)', 'Status', 'Notes', 'Last Updated',
        'Payment Info', 'Payment Proof'
      ]]);
      sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Process Payment Proof Upload
    let paymentProofUrl = '';
    if (data.paymentProofBase64) {
      try {
        const rootFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        const monthName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");
        
        let monthFolders = rootFolder.getFoldersByName(monthName);
        let monthFolder;
        if (monthFolders.hasNext()) {
          monthFolder = monthFolders.next();
        } else {
          monthFolder = rootFolder.createFolder(monthName);
        }

        const parts = data.paymentProofBase64.match(/^data:(.*?);base64,(.*)$/);
        let mimeType = 'image/jpeg';
        let b64 = data.paymentProofBase64;
        let ext = '.jpg';

        if (parts) {
          mimeType = parts[1];
          b64 = parts[2];
          if (mimeType.includes('png')) ext = '.png';
          else if (mimeType.includes('pdf')) ext = '.pdf';
        }
        
        const blob = Utilities.newBlob(Utilities.base64Decode(b64), mimeType, data.id + ext);
        const file = monthFolder.createFile(blob);
        // Make the file readable by anyone with the link (optional, depends on your preference)
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        paymentProofUrl = file.getUrl();
      } catch (err) {
        Logger.log('Drive Upload Error: ' + err.message);
        // Continue even if upload fails
      }
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
      new Date().toLocaleString('id-ID'),
      data.paymentInfo || '',
      paymentProofUrl || ''
    ];

    if (data.action === 'create') {
      sheet.appendRow(row);
    } else if (data.action === 'update' || data.action === 'cancel' || data.action === 'confirmed') {
      // Find existing row by Booking ID and update it
      const values = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          // If the row exists, preserve existing Payment Info/Proof if we are not passing new ones
          if (!data.paymentInfo && values[i][13]) row[13] = values[i][13];
          if (!paymentProofUrl && values[i][14]) row[14] = values[i][14];

          sheet.getRange(i + 1, 1, 1, 15).setValues([row]);
          found = true;
          break;
        }
      }
      // If not found, add as new row
      if (!found) sheet.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, paymentProofUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
