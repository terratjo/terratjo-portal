const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// 1. Add columns to bookings via seedData()
const newMigrations = `  await db.execute('ALTER TABLE bookings ADD COLUMN payment_method TEXT').catch(() => {});
  await db.execute('ALTER TABLE bookings ADD COLUMN payment_proof_url TEXT').catch(() => {});
  // Migration: update existing BK- booking IDs to TJ-`;
server = server.replace('// Migration: update existing BK- booking IDs to TJ-', newMigrations);

// 2. Update mapBooking
const mapBookingStr = `paymentMethod:row.payment_method||'', paymentProofUrl:row.payment_proof_url||'',`;
server = server.replace("promoId:row.promo_id||null, createdAt:row.created_at, source:row.source||''", mapBookingStr + "\n  promoId:row.promo_id||null, createdAt:row.created_at, source:row.source||''");

// 3. Update syncToSheets
const newSyncToSheets = `async function syncToSheets(action, booking) {
  if (!SHEETS_WEBHOOK) return null; // Skip if not configured
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
