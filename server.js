const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@libsql/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'terratjo-secure-secret-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Database (Turso LibSQL — works locally with file: and in cloud with libsql:)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:terratjo.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

async function initDB() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'staff'
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT,
      capacity INTEGER DEFAULT 2, rate REAL DEFAULT 0, desc TEXT
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, type TEXT, guest_name TEXT, guest_email TEXT,
      phone TEXT, address TEXT, num_guests INTEGER DEFAULT 1, room_id TEXT,
      checkin TEXT, checkout TEXT, checkin_time TEXT DEFAULT '14:00',
      checkout_time TEXT DEFAULT '12:00', rate REAL DEFAULT 0,
      cleaning_fee REAL DEFAULT 0, additional_fee REAL DEFAULT 0, deposit REAL DEFAULT 0, tax REAL DEFAULT 0,
      status TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS promos (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT DEFAULT 'percentage',
      value REAL DEFAULT 0, room_id TEXT DEFAULT 'all',
      start_date TEXT, end_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await seedData();
}

async function seedData() {
  // Migration: add promo_id to bookings (safe – silently ignored if column already exists)
  await db.execute('ALTER TABLE bookings ADD COLUMN promo_id TEXT').catch(() => {});
  // Migration: add source (reservation platform) to bookings
  await db.execute('ALTER TABLE bookings ADD COLUMN source TEXT').catch(() => {});
  await db.execute('ALTER TABLE bookings ADD COLUMN additional_fee REAL DEFAULT 0').catch(() => {});
    await db.execute('ALTER TABLE bookings ADD COLUMN payment_method TEXT').catch(() => {});
  await db.execute('ALTER TABLE bookings ADD COLUMN payment_proof_url TEXT').catch(() => {});
  // Migration: update existing BK- booking IDs to TJ-
  await db.execute("UPDATE bookings SET id = REPLACE(id, 'BK-', 'TJ-') WHERE id LIKE 'BK-%'").catch(() => {});
  // Migration: rename 'admin' to 'terratjo' if it exists
  const { rows: adminRows } = await db.execute({ sql:'SELECT id FROM users WHERE username = ?', args:['admin'] });
  if (adminRows.length > 0) {
    await db.execute({ sql:'UPDATE users SET username = ? WHERE username = ?', args:['terratjo','admin'] });
  }

  const { rows: [uc] } = await db.execute('SELECT COUNT(*) as c FROM users');
  if (Number(uc.c) === 0) {
    await db.execute({ sql: 'INSERT INTO users (username, password_hash, role) VALUES (?,?,?)',
      args: ['terratjo', bcrypt.hashSync('admin123', 10), 'admin'] });
  }

  const { rows: [rc] } = await db.execute('SELECT COUNT(*) as c FROM rooms');
  // Migration: add new rate columns to rooms
  await db.execute('ALTER TABLE rooms ADD COLUMN rate_weekend REAL DEFAULT 0').catch(() => {});
  await db.execute('ALTER TABLE rooms ADD COLUMN rate_high REAL DEFAULT 0').catch(() => {});
  await db.execute('ALTER TABLE rooms ADD COLUMN rate_high_weekend REAL DEFAULT 0').catch(() => {});
  await db.execute('ALTER TABLE rooms ADD COLUMN is_high_season INTEGER DEFAULT 0').catch(() => {});
  if (Number(rc.c) === 0) {
    await db.batch([
      { sql: 'INSERT OR IGNORE INTO rooms VALUES (?,?,?,?,?,?)', args: ['r1','Terratjo Room','Taman Melati Apt, Yogyakarta',2,310000,'Cozy studio with modern amenities'] },
      { sql: 'INSERT OR IGNORE INTO rooms VALUES (?,?,?,?,?,?)', args: ['r2','Terratjo Suite','Taman Melati Apt, Yogyakarta',4,550000,'Spacious suite with city view'] },
      { sql: 'INSERT OR IGNORE INTO rooms VALUES (?,?,?,?,?,?)', args: ['r3','Terratjo Deluxe','Taman Melati Apt, Yogyakarta',2,420000,'Deluxe room with premium furnishings'] }
    ], 'deferred');
  }
  const { rows: [sc] } = await db.execute('SELECT COUNT(*) as c FROM settings');
  if (Number(sc.c) === 0) {
    const defaults = {
      brand:'Terratjo Room', tagline:'Booking Portal',
      location:'Taman Melati Apt - Yogyakarta',
      invAddress:'at Taman Melati Apartment Yogyakarta',
      email:'info@terratjo.com', phone:'+62 821-9999-1161',
      bankName:'Bank Central Asia (BCA)',
      accName:'Thomas Vialdo Resky Lamandau', accNo:'060-132-7499',
      social:'@terratjo',
      notes:'Thank you for choosing Terratjo Room at Taman Melati Apartment Yogyakarta'
    };
    await db.batch(
      Object.entries(defaults).map(([k,v]) => ({ sql:'INSERT OR IGNORE INTO settings VALUES (?,?)', args:[k,v] })),
      'deferred'
    );
  }
}

// ── SSE ───────────────────────────────────────────────────────────
const sseClients = new Set();
function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(c => { try { c.write(msg); } catch {} });
}
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.flushHeaders();
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
});

// ── Auth ──────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username & password required' });
  try {
    await db.execute({ sql:'INSERT INTO users (username, password_hash) VALUES (?,?)',
      args:[username, bcrypt.hashSync(password, 10)] });
    res.status(201).json({ success: true });
  } catch { res.status(400).json({ error: 'Username already exists' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { rows } = await db.execute({ sql:'SELECT * FROM users WHERE username = ?', args:[username] });
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: Number(user.id), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, role: user.role });
});

app.post('/api/auth/change-password', async (req, res) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'Token required' });
  let userId;
  try { userId = jwt.verify(t, JWT_SECRET).id; }
  catch { return res.status(403).json({ error: 'Invalid token' }); }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const { rows } = await db.execute({ sql:'SELECT * FROM users WHERE id = ?', args:[userId] });
  const user = rows[0];
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ error: 'Current password is incorrect' });
  await db.execute({ sql:'UPDATE users SET password_hash = ? WHERE id = ?', args:[bcrypt.hashSync(newPassword, 10), userId] });
  res.json({ success: true });
});

const auth = (req, res, next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'Token required' });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { res.status(403).json({ error: 'Invalid/expired token' }); }
};

// ── Google Sheets Sync ────────────────────────────────────────────
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbxDYikl_WDSKKqgTkdQ9-I4smcR2hyqcCEYwaSbHTDC184wLNiqyGlnv-7RHchxOIa23A/exec';
async function syncToSheets(action, booking) {
  if (!SHEETS_WEBHOOK) return null; // Skip if not configured
  try {
    const res = await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...booking })
    });
    const result = await res.json();
    console.log(`✅ Google Sheets synced: ${action} → ${booking.id}`, JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    console.warn('Google Sheets sync failed (non-critical):', e.message);
    return null;
  }
}

// ── Auto-expire Quotations after 6 hours ────────────────────
async function expireOldQuotations() {
  try {
    const result = await db.execute({
      sql: `UPDATE bookings SET status='expired' WHERE status='quotation' AND created_at < datetime('now', '-6 hours')`,
      args: []
    });
    if (result.rowsAffected > 0) {
      console.log(`⏰ Auto-expired ${result.rowsAffected} quotation(s)`);
      broadcast({ type: 'sync', target: 'all' });
    }
  } catch (e) {
    console.warn('Expiry job error:', e.message);
  }
}

async function completeOldBookings() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result = await db.execute({
      sql: `UPDATE bookings SET status='completed' WHERE status='confirmed' AND checkout < ?`,
      args: [today]
    });
    if (result.rowsAffected > 0) {
      console.log(`✅ Auto-completed ${result.rowsAffected} booking(s) past checkout date`);
      broadcast({ type: 'sync', target: 'all' });
    }
  } catch (e) {
    console.warn('Completion job error:', e.message);
  }
}


// ── Settings ──────────────────────────────────────────────────────
// Public endpoint – returns only the logo (no auth required)
app.get('/api/logo', async (req, res) => {
  try {
    const { rows } = await db.execute("SELECT value FROM settings WHERE key='logo'");
    const logo = rows[0]?.value || '';
    res.json({ logo });
  } catch (e) { res.json({ logo: '' }); }
});
app.get('/api/settings', auth, async (req, res) => {
  const { rows } = await db.execute('SELECT key, value FROM settings');
  const obj = {}; rows.forEach(r => obj[r.key] = r.value); res.json(obj);
});
app.put('/api/settings', auth, async (req, res) => {
  try {
    await db.batch(
      Object.entries(req.body).map(([k,v]) => ({ sql:'INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', args:[k,String(v)] })),
      'write'
    );
    broadcast({ type:'sync', target:'all' }); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Rooms ─────────────────────────────────────────────────────────
app.get('/api/rooms', auth, async (req, res) => {
  const { rows } = await db.execute('SELECT * FROM rooms ORDER BY rate ASC'); res.json(rows);
});
app.post('/api/rooms', auth, async (req, res) => {
  const { id, name, location, capacity, rate, rate_weekend, rate_high, rate_high_weekend, is_high_season, desc } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    await db.execute({ sql:'INSERT INTO rooms (id, name, location, capacity, rate, rate_weekend, rate_high, rate_high_weekend, is_high_season, desc) VALUES (?,?,?,?,?,?,?,?,?,?)',
      args:[id||`r${Date.now()}`,name,location,capacity,rate,rate_weekend||0,rate_high||0,rate_high_weekend||0,is_high_season?1:0,desc] });
    broadcast({ type:'sync', target:'all' }); res.status(201).json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/rooms/:id', auth, async (req, res) => {
  const { name, location, capacity, rate, rate_weekend, rate_high, rate_high_weekend, is_high_season, desc } = req.body;
  const r = await db.execute({ sql:'UPDATE rooms SET name=?,location=?,capacity=?,rate=?,rate_weekend=?,rate_high=?,rate_high_weekend=?,is_high_season=?,desc=? WHERE id=?',
    args:[name,location,capacity,rate,rate_weekend||0,rate_high||0,rate_high_weekend||0,is_high_season?1:0,desc,req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});
app.delete('/api/rooms/:id', auth, async (req, res) => {
  const r = await db.execute({ sql:'DELETE FROM rooms WHERE id=?', args:[req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});

// ── Promos ────────────────────────────────────────────────────────
app.get('/api/promos', auth, async (req, res) => {
  const { rows } = await db.execute('SELECT * FROM promos ORDER BY created_at DESC');
  const today = new Date().toISOString().slice(0,10);
  res.json(rows.map(p => {
    let status = 'inactive';
    if (p.start_date && p.end_date) {
      if (today < p.start_date) status = 'scheduled';
      else if (today <= p.end_date) status = 'ongoing';
    }
    return { id:p.id, name:p.name, type:p.type, value:Number(p.value), roomId:p.room_id, startDate:p.start_date, endDate:p.end_date, status, createdAt:p.created_at };
  }));
});
app.post('/api/promos', auth, async (req, res) => {
  const { name, type, value, roomId, startDate, endDate } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = `PR-${String(Date.now()).slice(-6)}`;
  await db.execute({ sql:'INSERT INTO promos (id,name,type,value,room_id,start_date,end_date) VALUES (?,?,?,?,?,?,?)',
    args:[id,name,type||'percentage',Number(value)||0,roomId||'all',startDate||null,endDate||null] });
  broadcast({ type:'sync', target:'all' }); res.status(201).json({ success:true, id });
});
app.put('/api/promos/:id', auth, async (req, res) => {
  const { name, type, value, roomId, startDate, endDate } = req.body;
  const r = await db.execute({ sql:'UPDATE promos SET name=?,type=?,value=?,room_id=?,start_date=?,end_date=? WHERE id=?',
    args:[name,type||'percentage',Number(value)||0,roomId||'all',startDate||null,endDate||null,req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success:true });
});
app.delete('/api/promos/:id', auth, async (req, res) => {
  await db.execute({ sql:'DELETE FROM promos WHERE id=?', args:[req.params.id] });
  broadcast({ type:'sync', target:'all' }); res.json({ success:true });
});

// ── Bookings ──────────────────────────────────────────────────────
const mapBooking = row => ({
  id:row.id, type:row.type, guestName:row.guest_name, guestEmail:row.guest_email,
  phone:row.phone, address:row.address, numGuests:Number(row.num_guests), room:row.room_id,
  checkin:row.checkin, checkout:row.checkout, checkinTime:row.checkin_time,
  checkoutTime:row.checkout_time, rate:Number(row.rate), cleaningFee:Number(row.cleaning_fee),
  additionalFee:Number(row.additional_fee),
  deposit:Number(row.deposit), tax:Number(row.tax), status:row.status, notes:row.notes,
  paymentMethod:row.payment_method||'', paymentProofUrl:row.payment_proof_url||'',
  promoId:row.promo_id||null, createdAt:row.created_at, source:row.source||''
});
app.get('/api/bookings', auth, async (req, res) => {
  const { rows } = await db.execute('SELECT * FROM bookings ORDER BY created_at DESC'); res.json(rows.map(mapBooking));
});
app.post('/api/bookings', auth, async (req, res) => {
  const { id,type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,
          checkinTime,checkoutTime,rate,cleaningFee,additionalFee,deposit,tax,status,notes,promoId,source } = req.body;
  const idGen = id || `TJ-${String(Date.now()).slice(-6)}`;
  const nights = checkin && checkout ? Math.max(1,(new Date(checkout)-new Date(checkin))/(86400000)) : 1;
  let discAmt = 0;
  if (promoId) { const {rows:pr}=await db.execute({sql:'SELECT * FROM promos WHERE id=?',args:[promoId]}); if(pr[0]) { discAmt = pr[0].type==='percentage' ? (nights*(Number(rate)||0))*(Number(pr[0].value)/100) : Number(pr[0].value); } }
  const total = (nights * (Number(rate)||0)) + (Number(cleaningFee)||0) + (Number(additionalFee)||0) + (Number(deposit)||0) + (Number(tax)||0) - discAmt;
  try {
    await db.execute({ sql:`INSERT INTO bookings (id,type,guest_name,guest_email,phone,address,num_guests,room_id,checkin,checkout,checkin_time,checkout_time,rate,cleaning_fee,additional_fee,deposit,tax,status,notes,promo_id,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args:[idGen,type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,checkinTime,checkoutTime,rate,cleaningFee,additionalFee||0,deposit,tax,status,notes,promoId||null,source||''] });
    if (status === 'confirmed') {
      let roomNameStr = room;
      try { const {rows:rm} = await db.execute({sql:'SELECT name FROM rooms WHERE id=?',args:[room]}); if(rm[0]) roomNameStr=rm[0].name; } catch(e) {}
      syncToSheets('confirmed', {id:idGen,guestName,guestEmail,phone,address,room:roomNameStr,checkin,checkout,numGuests,total,status,notes,promo:discAmt||'',reservationDetails:source||'',additionalFee:additionalFee||0});
    }
    broadcast({ type:'sync', target:'all' }); res.status(201).json({ success: true, id: idGen });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/bookings/:id', auth, async (req, res) => {
  const { type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,
          checkinTime,checkoutTime,rate,cleaningFee,additionalFee,deposit,tax,status,notes,promoId,source,paymentMethod,paymentProofBase64 } = req.body;
  const nights = checkin && checkout ? Math.max(1,(new Date(checkout)-new Date(checkin))/(86400000)) : 1;
  let discAmt = 0;
  if (promoId) { const {rows:pr}=await db.execute({sql:'SELECT * FROM promos WHERE id=?',args:[promoId]}); if(pr[0]) { discAmt = pr[0].type==='percentage' ? (nights*(Number(rate)||0))*(Number(pr[0].value)/100) : Number(pr[0].value); } }
  const total = (nights * (Number(rate)||0)) + (Number(cleaningFee)||0) + (Number(additionalFee)||0) + (Number(deposit)||0) + (Number(tax)||0) - discAmt;
  const r = await db.execute({ sql:`UPDATE bookings SET type=?,guest_name=?,guest_email=?,phone=?,address=?,num_guests=?,room_id=?,checkin=?,checkout=?,checkin_time=?,checkout_time=?,rate=?,cleaning_fee=?,additional_fee=?,deposit=?,tax=?,status=?,notes=?,promo_id=?,source=?,payment_method=? WHERE id=?`,
    args:[type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,checkinTime,checkoutTime,rate,cleaningFee,additionalFee||0,deposit,tax,status,notes,promoId||null,source||'',paymentMethod||'',req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  if (status === 'confirmed') {
    let roomNameStr = room;
    try { const {rows:rm} = await db.execute({sql:'SELECT name FROM rooms WHERE id=?',args:[room]}); if(rm[0]) roomNameStr=rm[0].name; } catch(e) {}
    const syncResult = await syncToSheets('confirmed', {id:req.params.id,guestName,guestEmail,phone,address,room:roomNameStr,checkin,checkout,numGuests,total,status,notes,promo:discAmt||'',reservationDetails:source||'',additionalFee:additionalFee||0,paymentInfo:paymentMethod||'',paymentProofBase64});
      if (syncResult && syncResult.paymentProofUrl) {
        await db.execute({ sql: 'UPDATE bookings SET payment_proof_url=? WHERE id=?', args: [syncResult.paymentProofUrl, req.params.id] });
      }
  }
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});
app.delete('/api/bookings/:id', auth, async (req, res) => {
  const r = await db.execute({ sql:'UPDATE bookings SET status=? WHERE id=?', args:['cancelled',req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});
app.delete('/api/bookings/:id/permanent', auth, async (req, res) => {
  const r = await db.execute({ sql:'DELETE FROM bookings WHERE id=?', args:[req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});

// ── Dynamic Favicon (always matches uploaded logo) ────────────────
async function serveLogo(req, res, fallback) {
  try {
    const { rows } = await db.execute("SELECT value FROM settings WHERE key='logo'");
    const logo = rows[0]?.value || '';
    if (logo && logo.includes('base64,')) {
      const mimeMatch = logo.match(/data:([^;]+);base64,/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const buf = Buffer.from(logo.split(',')[1], 'base64');
      res.set('Content-Type', mime);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(buf);
    }
  } catch(e) {}
  res.sendFile(path.join(__dirname, 'public', fallback));
}
app.get('/favicon.png', (req, res) => serveLogo(req, res, 'favicon.png'));
app.get('/favicon.ico', (req, res) => serveLogo(req, res, 'favicon.png'));
app.get('/apple-touch-icon.png', (req, res) => serveLogo(req, res, 'favicon.png'));
app.get('/apple-touch-icon-precomposed.png', (req, res) => serveLogo(req, res, 'favicon.png'));

// ── Serve Frontend ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Start ─────────────────────────────────────────────────────────
initDB()
  .then(() => {
    // Run expiry check immediately on boot, then every 10 minutes
    // Run jobs immediately on boot, then on schedule
    expireOldQuotations();
    setInterval(expireOldQuotations, 10 * 60 * 1000);
    completeOldBookings();
    setInterval(completeOldBookings, 60 * 60 * 1000); // every hour
    // Start server locally (Vercel handles this automatically in production)
    if (!process.env.VERCEL) {
      app.listen(PORT, () => console.log(`🚀 Terratjo Portal running on http://localhost:${PORT}`));
    }
  })
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });

// Export for Vercel serverless
module.exports = app;
