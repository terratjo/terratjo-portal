const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// 1. Add columns to bookings
const initDB = `  db.exec(\`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, type TEXT, guest_name TEXT, guest_email TEXT,
      phone TEXT, address TEXT, num_guests INTEGER DEFAULT 1, room_id TEXT,
      checkin TEXT, checkout TEXT, checkin_time TEXT DEFAULT '14:00',
      checkout_time TEXT DEFAULT '12:00', rate REAL DEFAULT 0,
      cleaning_fee REAL DEFAULT 0, additional_fee REAL DEFAULT 0, deposit REAL DEFAULT 0, tax REAL DEFAULT 0,
      status TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    -- ADD PAYMENT COLUMNS
    ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT '';
    ALTER TABLE bookings ADD COLUMN payment_proof_url TEXT DEFAULT '';`;

server = server.replace(/CREATE TABLE IF NOT EXISTS bookings \([\s\S]*?TIMESTAMP\n    \);/, initDB);

// Note: ALTER TABLE might fail if columns already exist, so it should be caught, but db.exec allows multiple statements and might just throw on error.
// To be safe, I'll execute them separately inside try/catch block.
const alterDB = `
  try { await db.execute('ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT ""'); } catch(e){}
  try { await db.execute('ALTER TABLE bookings ADD COLUMN payment_proof_url TEXT DEFAULT ""'); } catch(e){}
`;
server = server.replace('db.exec(`\n    CREATE TABLE IF NOT EXISTS settings', alterDB + '\n  db.exec(`\n    CREATE TABLE IF NOT EXISTS settings');

// 2. Update mapBooking
const mapBookingStr = `paymentMethod:row.payment_method||'', paymentProofUrl:row.payment_proof_url||'',`;
server = server.replace('promoId:row.promo_id||null, createdAt:row.created_at, source:row.source||\'\'', mapBookingStr + '\npromoId:row.promo_id||null, createdAt:row.created_at, source:row.source||\'\'');

// 3. Update syncToSheets
const newSyncToSheets = `async function syncToSheets(action, booking) {
  if (!SHEETS_WEBHOOK) return; // Skip if not configured
  try {
    const res = await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...booking })
    });
    const result = await res.json();
    console.log(\`✅ Google Sheets synced: \${action} → \${booking.id}\`);
    return result;
  } catch (e) {
    console.warn('Google Sheets sync failed (non-critical):', e.message);
    return null;
  }
}`;
server = server.replace(/async function syncToSheets\(action, booking\) \{[\s\S]*?catch \(e\) \{\n    console.warn\('Google Sheets sync failed \(non-critical\):', e.message\);\n  \}\n\}/, newSyncToSheets);

// 4. Update PUT /api/bookings/:id
const oldPut = `const { type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,
          checkinTime,checkoutTime,rate,cleaningFee,additionalFee,deposit,tax,status,notes,promoId,source } = req.body;
  const nights = checkin && checkout ? Math.max(1,(new Date(checkout)-new Date(checkin))/(86400000)) : 1;
  const total = (nights * (Number(rate)||0)) + (Number(cleaningFee)||0) + (Number(additionalFee)||0) + (Number(deposit)||0);
  const r = await db.execute({ sql:\`UPDATE bookings SET type=?,guest_name=?,guest_email=?,phone=?,address=?,num_guests=?,room_id=?,checkin=?,checkout=?,checkin_time=?,checkout_time=?,rate=?,cleaning_fee=?,additional_fee=?,deposit=?,tax=?,status=?,notes=?,promo_id=?,source=? WHERE id=?\`,
    args:[type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,checkinTime,checkoutTime,rate,cleaningFee,additionalFee||0,deposit,tax,status,notes,promoId||null,source||'',req.params.id] });`;

const newPut = `const { type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,
          checkinTime,checkoutTime,rate,cleaningFee,additionalFee,deposit,tax,status,notes,promoId,source,paymentMethod,paymentProofBase64 } = req.body;
  const nights = checkin && checkout ? Math.max(1,(new Date(checkout)-new Date(checkin))/(86400000)) : 1;
  const total = (nights * (Number(rate)||0)) + (Number(cleaningFee)||0) + (Number(additionalFee)||0) + (Number(deposit)||0);
  const r = await db.execute({ sql:\`UPDATE bookings SET type=?,guest_name=?,guest_email=?,phone=?,address=?,num_guests=?,room_id=?,checkin=?,checkout=?,checkin_time=?,checkout_time=?,rate=?,cleaning_fee=?,additional_fee=?,deposit=?,tax=?,status=?,notes=?,promo_id=?,source=?,payment_method=? WHERE id=?\`,
    args:[type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,checkinTime,checkoutTime,rate,cleaningFee,additionalFee||0,deposit,tax,status,notes,promoId||null,source||'',paymentMethod||'',req.params.id] });`;

server = server.replace(oldPut, newPut);

const oldSyncCall = `syncToSheets('confirmed', {id:req.params.id,guestName,guestEmail,phone,address,room,checkin,checkout,numGuests,total,status,notes,promo:promoLabel,reservationDetails:source||'',additionalFee:additionalFee||0});`;

const newSyncCall = `const syncResult = await syncToSheets('confirmed', {id:req.params.id,guestName,guestEmail,phone,address,room,checkin,checkout,numGuests,total,status,notes,promo:promoLabel,reservationDetails:source||'',additionalFee:additionalFee||0,paymentInfo:paymentMethod||'',paymentProofBase64});
      if (syncResult && syncResult.paymentProofUrl) {
        await db.execute({ sql: 'UPDATE bookings SET payment_proof_url=? WHERE id=?', args: [syncResult.paymentProofUrl, req.params.id] });
      }`;

server = server.replace(oldSyncCall, newSyncCall);

fs.writeFileSync('server.js', server);
