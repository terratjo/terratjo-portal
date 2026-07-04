// ── Terratjo Portal → Google Sheets Integration ──────────────────
// Paste this entire file into Google Apps Script (Extensions > Apps Script)
// Then: Deploy > New Deployment > Web App > Anyone > Deploy

const SHEET_NAME = 'Bookings'; // Ensure your tab is named Bookings, or change this to match your sheet tab name
const DRIVE_FOLDER_ID = '1Ls0zNyBmi8v8vVHAG_Nt99SlycTbg1VO'; // Drive folder for payment proofs

// Run this function ONCE from the editor to grant permissions!
function install() {
  SpreadsheetApp.getActiveSpreadsheet();
  DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log("Permissions granted successfully!");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0]; // Fallback to first sheet if name mismatch

    // Process Payment Proof Upload
    let paymentProofUrl = '';
    let uploadStatus = 'No file';
    if (data.paymentProofBase64) {
      try {
        const rootFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        const monthName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM").toUpperCase(); // e.g. "JULY"
        
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
        
        const blob = Utilities.newBlob(Utilities.base64Decode(b64), mimeType, (data.guestName || data.id) + ext);
        const file = monthFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        paymentProofUrl = file.getUrl();
        uploadStatus = 'Success';
      } catch (err) {
        uploadStatus = 'Error: ' + err.message;
        Logger.log('Drive Upload Error: ' + err.message);
      }
    }

    // Dynamic Column Mapping
    const lastCol = sheet.getLastColumn() || 15;
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h.toString().trim().toUpperCase());
    
    // Create an empty row array
    const row = new Array(lastCol).fill('');
    
    // Helper to set value if column exists
    const setCol = (name, value) => {
      const idx = headers.indexOf(name.toUpperCase());
      if (idx !== -1) row[idx] = value;
    };

    // Map all fields based on the user's specific columns
    setCol('Booking ID', data.id || '');
    setCol('Booking Code', data.id || '');
    setCol('Submission time', new Date().toLocaleString('id-ID'));
    setCol('FULL NAME', data.guestName || '');
    setCol('ADDRESS', data.address || '');
    setCol('OCCUPANTS', data.numGuests || 1);
    setCol('ROOM TYPE', data.room || '');
    setCol('CHECK-IN DATE', data.checkin || '');
    setCol('CHECK-OUT DATE', data.checkout || '');
    setCol('EMAIL', data.guestEmail || '');
    setCol('PHONE NUMBER', data.phone || '');
    setCol('Special Notes', data.notes || '');
    setCol('Reservation Details', data.reservationDetails || '');
    setCol('Additional Fee', data.additionalFee || 0);
    setCol('PROMO', data.promo || '');
    setCol('Payment Info', data.paymentInfo || '');
    setCol('Payment Proof', paymentProofUrl || '');
    setCol('Total (IDR)', data.total || 0);
    setCol('TOTAL PAYMENT', data.total || 0);
    setCol('Status', data.status || '');

    // Finding the existing row to update
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Try finding by Booking ID first (if it exists)
    const idIdx = headers.indexOf('BOOKING ID');
    if (idIdx !== -1) {
      for (let i = 1; i < values.length; i++) {
        if (values[i][idIdx] === data.id) { rowIndex = i; break; }
      }
    }
    
    // If not found, try matching FULL NAME + CHECK-IN DATE
    if (rowIndex === -1) {
      const nameIdx = headers.indexOf('FULL NAME');
      const ciIdx = headers.indexOf('CHECK-IN DATE');
      if (nameIdx !== -1 && ciIdx !== -1) {
        for (let i = 1; i < values.length; i++) {
          if (values[i][nameIdx] === data.guestName && values[i][ciIdx] === data.checkin) {
            rowIndex = i; break;
          }
        }
      }
    }

    if (rowIndex !== -1) {
      // Row exists, update it!
      // Preserve old Payment Info / Proof if no new one was provided
      const piIdx = headers.indexOf('PAYMENT INFO');
      const ppIdx = headers.indexOf('PAYMENT PROOF');
      if (piIdx !== -1 && !data.paymentInfo && values[rowIndex][piIdx]) row[piIdx] = values[rowIndex][piIdx];
      if (ppIdx !== -1 && !paymentProofUrl && values[rowIndex][ppIdx]) row[ppIdx] = values[rowIndex][ppIdx];
      
      sheet.getRange(rowIndex + 1, 1, 1, lastCol).setValues([row]);
    } else {
      // Not found, append a new row but avoid data validation pushing it to row 1000
      const colA = sheet.getRange(1, 1, sheet.getMaxRows(), 1).getValues();
      let emptyRowIdx = colA.findIndex(r => !r[0] || r[0].toString().trim() === '') + 1;
      if (emptyRowIdx <= 1) emptyRowIdx = sheet.getLastRow() + 1; // Fallback
      
      sheet.getRange(emptyRowIdx, 1, 1, lastCol).setValues([row]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, paymentProofUrl, uploadStatus }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message, stack: err.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
