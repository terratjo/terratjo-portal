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
      cleaning_fee REAL DEFAULT 0, deposit REAL DEFAULT 0, tax REAL DEFAULT 0,
      status TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await seedData();
}

async function seedData() {
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
const SHEETS_WEBHOOK = process.env.SHEETS_WEBHOOK_URL || '';
async function syncToSheets(action, booking) {
  if (!SHEETS_WEBHOOK) return; // Skip if not configured
  try {
    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...booking })
    });
  } catch (e) {
    console.warn('Google Sheets sync failed (non-critical):', e.message);
  }
}




// ── Settings ──────────────────────────────────────────────────────
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
  const { id, name, location, capacity, rate, desc } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    await db.execute({ sql:'INSERT INTO rooms VALUES (?,?,?,?,?,?)',
      args:[id||`r${Date.now()}`,name,location,capacity,rate,desc] });
    broadcast({ type:'sync', target:'all' }); res.status(201).json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/rooms/:id', auth, async (req, res) => {
  const { name, location, capacity, rate, desc } = req.body;
  const r = await db.execute({ sql:'UPDATE rooms SET name=?,location=?,capacity=?,rate=?,desc=? WHERE id=?',
    args:[name,location,capacity,rate,desc,req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});
app.delete('/api/rooms/:id', auth, async (req, res) => {
  const r = await db.execute({ sql:'DELETE FROM rooms WHERE id=?', args:[req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  broadcast({ type:'sync', target:'all' }); res.json({ success: true });
});

// ── Bookings ──────────────────────────────────────────────────────
const mapBooking = row => ({
  id:row.id, type:row.type, guestName:row.guest_name, guestEmail:row.guest_email,
  phone:row.phone, address:row.address, numGuests:Number(row.num_guests), room:row.room_id,
  checkin:row.checkin, checkout:row.checkout, checkinTime:row.checkin_time,
  checkoutTime:row.checkout_time, rate:Number(row.rate), cleaningFee:Number(row.cleaning_fee),
  deposit:Number(row.deposit), tax:Number(row.tax), status:row.status, notes:row.notes, createdAt:row.created_at
});
app.get('/api/bookings', auth, async (req, res) => {
  const { rows } = await db.execute('SELECT * FROM bookings ORDER BY checkin DESC'); res.json(rows.map(mapBooking));
});
app.post('/api/bookings', auth, async (req, res) => {
  const { id,type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,
          checkinTime,checkoutTime,rate,cleaningFee,deposit,tax,status,notes } = req.body;
  const idGen = id || `BK-${String(Date.now()).slice(-6)}`;
  const nights = checkin && checkout ? Math.max(1,(new Date(checkout)-new Date(checkin))/(86400000)) : 1;
  const total = (nights * (Number(rate)||0)) + (Number(cleaningFee)||0) + (Number(deposit)||0);
  try {
    await db.execute({ sql:`INSERT INTO bookings (id,type,guest_name,guest_email,phone,address,num_guests,room_id,checkin,checkout,checkin_time,checkout_time,rate,cleaning_fee,deposit,tax,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args:[idGen,type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,checkinTime,checkoutTime,rate,cleaningFee,deposit,tax,status,notes] });
    syncToSheets('create', {id:idGen,guestName,guestEmail,phone,address,room,checkin,checkout,numGuests,total,status,notes});
    broadcast({ type:'sync', target:'all' }); res.status(201).json({ success: true, id: idGen });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/bookings/:id', auth, async (req, res) => {
  const { type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,
          checkinTime,checkoutTime,rate,cleaningFee,deposit,tax,status,notes } = req.body;
  const nights = checkin && checkout ? Math.max(1,(new Date(checkout)-new Date(checkin))/(86400000)) : 1;
  const total = (nights * (Number(rate)||0)) + (Number(cleaningFee)||0) + (Number(deposit)||0);
  const r = await db.execute({ sql:`UPDATE bookings SET type=?,guest_name=?,guest_email=?,phone=?,address=?,num_guests=?,room_id=?,checkin=?,checkout=?,checkin_time=?,checkout_time=?,rate=?,cleaning_fee=?,deposit=?,tax=?,status=?,notes=? WHERE id=?`,
    args:[type,guestName,guestEmail,phone,address,numGuests,room,checkin,checkout,checkinTime,checkoutTime,rate,cleaningFee,deposit,tax,status,notes,req.params.id] });
  if (!r.rowsAffected) return res.status(404).json({ error:'Not found' });
  syncToSheets('update', {id:req.params.id,guestName,guestEmail,phone,address,room,checkin,checkout,numGuests,total,status,notes});
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

// ── TEMPORARY: Emergency Reset (remove after use) ────────────────
app.post('/api/emergency-reset', async (req, res) => {
  const { secret, newUsername, newPassword } = req.body;
  if (secret !== 'terratjo-reset-2026') return res.status(403).json({ error: 'Invalid secret' });
  if (!newUsername || !newPassword) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hash = bcrypt.hashSync(newPassword, 10);
    // Delete all users and recreate
    await db.execute('DELETE FROM users');
    await db.execute({ sql: 'INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', args: [newUsername, hash, 'admin'] });
    res.json({ success: true, message: `User "${newUsername}" reset successfully. Remove this endpoint after use.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Serve Frontend ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Start ─────────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 Terratjo Portal running on http://localhost:${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
