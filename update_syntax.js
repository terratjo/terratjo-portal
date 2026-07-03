const fs = require('fs');
let code = fs.readFileSync('public/client.js', 'utf8');

code = code.replace("'lbl.no_bookings':'${t('lbl.no_bookings')}'", "'lbl.no_bookings':'No bookings found.'");
code = code.replace("'lbl.no_documents':'${t('lbl.no_documents')}'", "'lbl.no_documents':'No documents found.'");
code = code.replace("'lbl.no_bookings':'${t('lbl.no_bookings')}'", "'lbl.no_bookings':'Tidak ada pemesanan ditemukan.'");
code = code.replace("'lbl.no_documents':'${t('lbl.no_documents')}'", "'lbl.no_documents':'Tidak ada dokumen ditemukan.'");

fs.writeFileSync('public/client.js', code);
