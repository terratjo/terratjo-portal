// ── Auth & State ────────────────────────────────────────────────
const API = '/api';
const app = { settings: {}, rooms: [], bookings: [] };
let token = localStorage.getItem('terratjo_token');
let currentFormAction = 'booking', currentIPMId = null, prevPage = 'calendar', lastAction = 'booking';
const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
let calYear = today.getFullYear(), calMonth = today.getMonth();

// ── Mobile Sidebar ───────────────────────────────────────────────
function openSidebar() {
  document.querySelector('.sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-overlay').classList.add('active');
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}
// Close sidebar when a nav item is tapped on mobile
document.addEventListener('click', e => {
  if (e.target.closest('.nav-item')) closeSidebar();
});


// ── API Client ──────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  if (!token && !path.startsWith('/auth')) { showLogin(); return; }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) { logout(); return; }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
const api = {
  get: path => apiFetch(path),
  post: (path, data) => apiFetch(path, { method:'POST', body: JSON.stringify(data) }),
  put: (path, data) => apiFetch(path, { method:'PUT', body: JSON.stringify(data) }),
  del: path => apiFetch(path, { method:'DELETE' })
};

// ── Helpers ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = d => d.toISOString().split('T')[0];
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const idr = n => 'Rp ' + Number(n).toLocaleString('id-ID');
const shortDate = s => s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '';
const nightsCount = (ci, co) => Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));
const getRoomName = id => (app.rooms.find(r => r.id === id) || { name:'—' }).name;
const getRoomRate = id => (app.rooms.find(r => r.id === id) || { rate:310000 }).rate;
const calcTotal = b => { const n = nightsCount(b.checkin, b.checkout); const acc = n * b.rate; const tax = Math.round((acc + b.cleaningFee) * (b.tax / 100)); return acc + b.cleaningFee + b.deposit + tax; };
const todayStr = fmt(today);
const isExpired = b => b.status === 'quotation' && b.checkin < todayStr;
const effStatus = b => isExpired(b) ? 'expired' : b.status;

function showToast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2800); }
function statusBadge(s) { const m = { confirmed:'badge-confirmed', awaiting:'badge-awaiting', quotation:'badge-quotation', cancelled:'badge-cancelled', expired:'badge-expired' }; const l = { confirmed:'Confirmed', awaiting:'Awaiting Payment', quotation:'Quotation', cancelled:'Cancelled', expired:'Expired' }; return `<span class="badge ${m[s]||''}">${l[s]||s}</span>`; }
function typeBadge(t) { return t === 'quotation' ? `<span class="badge badge-quotation">Quotation</span>` : `<span class="badge badge-invoice">Invoice</span>`; }

// ── Auth UI ─────────────────────────────────────────────────────
function showLogin() { const o = $('login-overlay'); if (o) o.classList.add('active'); }
function logout() { token = null; localStorage.removeItem('terratjo_token'); showLogin(); }
window.logout = logout;

document.addEventListener('DOMContentLoaded', () => {

  // ── Login handler ──────────────────────────────────────────────
  async function doLogin() {
    const username = ($('login-user')?.value || '').trim();
    const password = ($('login-pass')?.value || '').trim();
    if (!username || !password) { showToast('Please enter username and password.'); return; }
    try {
      const res = await api.post('/auth/login', { username, password });
      token = res.token;
      localStorage.setItem('terratjo_token', token);
      $('login-overlay').classList.remove('active');
      initApp();
    } catch (e) { showToast('Login failed: ' + e.message); }
  }

  // Click the Sign In button
  const loginBtn = $('btn-login-submit');
  if (loginBtn) loginBtn.addEventListener('click', doLogin);

  // Also support pressing Enter inside the form fields
  ['login-user', 'login-pass'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } });
  });

  // Password visibility toggle
  const toggleBtn = $('password-toggle');
  const passInput = $('login-pass');
  const eyeOpen = $('eye-open');
  const eyeClosed = $('eye-closed');
  if (toggleBtn && passInput) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = passInput.type === 'password';
      passInput.type = isHidden ? 'text' : 'password';
      eyeOpen.style.display = isHidden ? 'none' : '';
      eyeClosed.style.display = isHidden ? '' : 'none';
      toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  }

  if (token) initApp(); else showLogin();
});

// ── Real-time Sync (SSE) ─────────────────────────────────────────
function initSSE() {
  if (!window.EventSource || !token) return;
  const evtSource = new EventSource(`${API}/events`);
  evtSource.onmessage = e => {
    const data = JSON.parse(e.data);
    if (data.type === 'sync') { loadData().then(() => { refreshCurrentPage(); showToast('🔄 Real-time sync applied'); }); }
  };
  evtSource.onerror = () => { evtSource.close(); setTimeout(initSSE, 5000); };
}

// ── Navigation ───────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = $('page-' + page); if (pg) pg.classList.remove('hidden');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`); if (nav) nav.classList.add('active');
  prevPage = page; refreshCurrentPage();
}
function setMbnActive(id) {
  document.querySelectorAll('.mbn-item').forEach(b => b.classList.remove('active'));
  const el = $(id); if (el) el.classList.add('active');
}
function refreshCurrentPage() {
  if (prevPage === 'calendar') renderCalendar();
  if (prevPage === 'all-bookings') renderBookings('all');
  if (prevPage === 'invoices') renderInvoices('all');
  if (prevPage === 'reports') renderReports('all');
  if (prevPage === 'inventory') renderInventory();
  if (prevPage === 'settings') renderSettings();
}
document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); }));

// ── Calendar ─────────────────────────────────────────────────────
function renderCalendar() {
  $('current-month-display').textContent = ['January','February','March','April','May','June','July','August','September','October','November','December'][calMonth] + ' ' + calYear;
  const grid = $('days-grid'); if (!grid) return; grid.innerHTML = '';
  const first = new Date(calYear, calMonth, 1).getDay();
  const dim = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDim = new Date(calYear, calMonth, 0).getDate();
  const todayStr = fmt(today);
  for (let i = first - 1; i >= 0; i--) grid.innerHTML += `<div class="day-cell"><div class="day-number inactive">${prevDim - i}</div></div>`;
  for (let d = 1; d <= dim; d++) {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = ds === todayStr; const isWE = [0, 6].includes(new Date(calYear, calMonth, d).getDay());
    let cls = isToday ? 'today' : isWE ? 'weekend' : ''; let blks = '';
    app.bookings.forEach(b => {
      if (ds >= b.checkin && ds < b.checkout) {
        const lbl = ds === b.checkin ? (b.guestName||'').split(' ')[0] : '';
        blks += `<div class="booking-block booking-${effStatus(b)}" data-bid="${b.id}" onclick="openIPM('${b.id}');event.stopPropagation();">${lbl}</div>`;
      }
    });
    grid.innerHTML += `<div class="day-cell" data-date="${ds}"><div class="day-number ${cls}">${d}</div>${blks}</div>`;
  }
  const total = first + dim; const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= rem; i++) grid.innerHTML += `<div class="day-cell"><div class="day-number inactive">${i}</div></div>`;
  document.querySelectorAll('.day-cell[data-date]').forEach(cell => cell.addEventListener('click', () => {
    if (window.innerWidth <= 768) { showDayDetail(cell.dataset.date); }
    else { openForm('booking', cell.dataset.date, null); }
  }));
}

// ── Day Detail Sheet (mobile) ─────────────────────────────────
function showDayDetail(dateStr) {
  const sheet = $('day-detail-sheet');
  const dateEl = $('day-detail-date');
  const eventsEl = $('day-detail-events');
  if (!sheet) return;
  const d = new Date(dateStr + 'T00:00:00');
  const wds = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mos = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  dateEl.textContent = wds[d.getDay()] + ' · ' + d.getDate() + ' ' + mos[d.getMonth()] + ' ' + d.getFullYear();
  const dayBkgs = (app.bookings||[]).filter(b => dateStr >= b.checkin && dateStr < b.checkout);
  const statusColor = s => s==='confirmed'?'var(--confirmed)':s==='awaiting'?'var(--awaiting)':s==='quotation'?'var(--quotation)':'var(--cancelled)';
  if (!dayBkgs.length) {
    eventsEl.innerHTML = '<div class="dds-empty">No bookings this day</div>';
  } else {
    eventsEl.innerHTML = dayBkgs.map(b => `<div class="dds-event" onclick="openIPM('${b.id}');closeDayDetail();">
      <div class="dds-dot" style="background:${statusColor(b.status)}"></div>
      <div class="dds-info">
        <div class="dds-name">${b.guestName}</div>
        <div class="dds-sub">${getRoomName(b.room)} &middot; ${shortDate(b.checkin)} &rarr; ${shortDate(b.checkout)}</div>
      </div>
      <span class="dds-chevron">›</span>
    </div>`).join('');
  }
  eventsEl.innerHTML += `<button class="btn btn-outline dds-new" onclick="openForm('booking','${dateStr}',null);closeDayDetail();">+ New Booking for this day</button>`;
  sheet.classList.add('active');
}
function closeDayDetail() { const s=$('day-detail-sheet'); if(s) s.classList.remove('active'); $('dds-overlay')?.classList.remove('active'); }
window.closeDayDetail = closeDayDetail;

// ── Month Picker (mobile) ─────────────────────────────────────
function openMonthPicker() {
  const sheet = $('month-picker-sheet'); if (!sheet) return;
  const yr = calYear;
  $('mps-year-row').innerHTML = [yr-1, yr, yr+1, yr+2].map(y =>
    `<button class="mps-year ${y===calYear?'active':''}" onclick="selectMpsYear(${y})">${y}</button>`
  ).join('');
  renderMpsMonths(calYear);
  sheet.classList.add('active'); $('mps-overlay')?.classList.add('active');
}
function renderMpsMonths(yr) {
  const mos=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  $('mps-months').innerHTML = mos.map((m,i) =>
    `<button class="mps-month ${i===calMonth&&yr===calYear?'active':''}" onclick="selectMpsMonth(${i},${yr})">${m}</button>`
  ).join('');
}
function selectMpsYear(y) {
  document.querySelectorAll('.mps-year').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.mps-year').forEach(b=>{if(parseInt(b.textContent)===y)b.classList.add('active');});
  renderMpsMonths(y);
}
function selectMpsMonth(month,year){calMonth=month;calYear=year;renderCalendar();closeMonthPicker();}
function closeMonthPicker(){$('month-picker-sheet')?.classList.remove('active');$('mps-overlay')?.classList.remove('active');}
window.openMonthPicker=openMonthPicker; window.selectMpsYear=selectMpsYear;
window.selectMpsMonth=selectMpsMonth; window.closeMonthPicker=closeMonthPicker;

// Mobile tap on month text → open picker
$('current-month-display')?.addEventListener('click', ()=>{ if(window.innerWidth<=768) openMonthPicker(); });

// Booking filter select sync (desktop tabs stay active)
function applyBookingsFilter(val){
  renderBookings(val);
  document.querySelectorAll('#bookings-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===val));
}
window.applyBookingsFilter = applyBookingsFilter;

$('btn-prev-month').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
$('btn-next-month').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });

// ── Tables ───────────────────────────────────────────────────────
function renderBookings(filter) {
  const tb = $('bookings-tbody'); if (!tb) return;
  const rows = app.bookings.filter(b => {
    const es = effStatus(b);
    if (filter === 'all') return true;
    if (filter === 'cancelled') return b.status === 'cancelled' || es === 'expired';
    if (filter === 'quotation') return b.status === 'quotation' && es !== 'expired';
    return b.status === filter;
  });
  tb.innerHTML = '';
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-light)">No bookings found.</td></tr>`; return; }
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    tb.innerHTML += `<tr><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div><div class="td-guest-email">${b.guestEmail||''}</div></td><td>${getRoomName(b.room)}</td><td>${shortDate(b.checkin)}</td><td>${shortDate(b.checkout)}</td><td>${n}n</td><td class="td-bold">${idr(calcTotal(b))}</td><td>${statusBadge(effStatus(b))}</td><td><button class="btn btn-primary btn-sm" onclick="openIPM('${b.id}')">View</button></td></tr>`;
  });
}
$('bookings-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#bookings-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderBookings(e.target.dataset.filter); });

function renderInvoices(filter) {
  const tb = $('invoices-tbody'); if (!tb) return;
  // Invoices page shows all non-cancelled docs; expired quotations stay visible
  const rows = app.bookings
    .filter(b => b.status !== 'cancelled')
    .filter(b => filter === 'all'
      || (filter === 'invoice' && b.type === 'invoice')
      || (filter === 'quotation' && b.type === 'quotation'));
  tb.innerHTML = '';
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-light)">No documents found.</td></tr>`; return; }
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    const es = effStatus(b);
    tb.innerHTML += `<tr><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div></td><td>${shortDate(b.checkin)} → ${shortDate(b.checkout)}</td><td>${n}n</td><td class="td-bold">${idr(calcTotal(b))}</td><td>${typeBadge(b.type)}</td><td>${statusBadge(es)}</td><td><button class="btn btn-primary btn-sm" onclick="openIPM('${b.id}')">Preview</button></td></tr>`;
  });
}
$('invoices-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#invoices-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderInvoices(e.target.dataset.filter); });

function renderReports(filter) {
  const confirmed = app.bookings.filter(b => b.status === 'confirmed');
  const awaiting = app.bookings.filter(b => b.status === 'awaiting');
  const quotations = app.bookings.filter(b => b.type === 'quotation');
  const cancelled = app.bookings.filter(b => b.status === 'cancelled');
  const bRev = app.bookings.filter(b => b.type === 'invoice' && b.status !== 'cancelled').reduce((s, b) => s + calcTotal(b), 0);
  const qVal = quotations.reduce((s, b) => s + calcTotal(b), 0);
  $('reports-stat-cards').innerHTML = `<div class="stat-card"><div class="stat-card-label">Total Revenue</div><div class="stat-card-value">${idr(bRev)}</div><div class="stat-card-sub green">from bookings</div></div><div class="stat-card"><div class="stat-card-label">Confirmed</div><div class="stat-card-value">${confirmed.length}</div><div class="stat-card-sub">bookings</div></div><div class="stat-card"><div class="stat-card-label">Awaiting Payment</div><div class="stat-card-value">${awaiting.length}</div><div class="stat-card-sub">need follow-up</div></div><div class="stat-card"><div class="stat-card-label">Quotations</div><div class="stat-card-value">${quotations.length}</div><div class="stat-card-sub">${cancelled.length} cancelled/expired</div></div>`;
  const tb = $('reports-tbody'); if (!tb) return;
  const rows = app.bookings.filter(b => filter === 'all' || (filter === 'booking' && b.type === 'invoice') || (filter === 'quotation' && b.type === 'quotation'));
  tb.innerHTML = '';
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    tb.innerHTML += `<tr><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div><div class="td-guest-email">${b.guestEmail||''}</div></td><td>${typeBadge(b.type)}</td><td>${getRoomName(b.room)}</td><td>${shortDate(b.checkin)}</td><td>${shortDate(b.checkout)}</td><td>${n}n</td><td>${idr(b.rate)}</td><td class="td-bold">${idr(calcTotal(b))}</td></tr>`;
  });
  $('reports-totals').innerHTML = `<span>Quotations value: <strong>${idr(qVal)}</strong></span><span>Bookings revenue: <strong>${idr(bRev)}</strong></span><span class="grand">Grand Total: ${idr(qVal + bRev)}</span>`;
}
$('reports-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#reports-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderReports(e.target.dataset.filter); });

// ── Inventory ─────────────────────────────────────────────────────
function renderInventory() {
  const list = $('rooms-list'); if (!list) return; list.innerHTML = '';
  app.rooms.forEach(r => {
    list.innerHTML += `<div class="room-card"><div class="room-card-info"><h3>${r.name}</h3><p>${r.location} · Max ${r.capacity} guests · ${idr(r.rate)}/night</p><p>${r.desc||''}</p></div><div class="room-card-actions"><button class="btn btn-outline btn-sm" onclick="openEditRoom('${r.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')">Delete</button></div></div>`;
  });
}
window.openEditRoom = id => {
  const r = app.rooms.find(x => x.id === id); if (!r) return;
  $('room-modal-title').textContent = 'Edit Room'; $('room-edit-id').value = id;
  $('room-name').value = r.name; $('room-location').value = r.location; $('room-capacity').value = r.capacity; $('room-rate').value = r.rate; $('room-desc').value = r.desc||'';
  $('room-modal').classList.add('active');
};
window.deleteRoom = async id => {
  if (!confirm('Delete this room?')) return;
  try { await api.del(`/rooms/${id}`); showToast('Room deleted.'); await loadData(); renderInventory(); }
  catch (e) { showToast('Delete failed: ' + e.message); }
};
$('btn-add-room')?.addEventListener('click', () => { $('room-modal-title').textContent = 'Add Room'; $('room-form').reset(); $('room-edit-id').value = ''; $('room-modal').classList.add('active'); });
$('room-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = { name:$('room-name').value, location:$('room-location').value, capacity:+$('room-capacity').value, rate:+$('room-rate').value, desc:$('room-desc').value };
  const eid = $('room-edit-id').value;
  try {
    if (eid) { await api.put(`/rooms/${eid}`, data); showToast('Room updated.'); }
    else { await api.post('/rooms', data); showToast('Room added.'); }
    $('room-modal').classList.remove('active'); await loadData(); renderInventory(); populateRoomSelect();
  } catch (e) { showToast('Save failed: ' + e.message); }
});
['btn-close-room-modal','btn-cancel-room'].forEach(id => $(id)?.addEventListener('click', () => $('room-modal').classList.remove('active')));

// ── Settings ──────────────────────────────────────────────────────
function renderSettings() {
  Object.entries(app.settings).forEach(([k, v]) => {
    const el = $('setting-' + k.replace(/([A-Z])/g, c => '-' + c.toLowerCase()));
    if (el) el.value = v;
  });
  updateSIP();
}
function updateSIP() {
  $('sip-brand').textContent = $('setting-brand')?.value || '';
  $('sip-address').textContent = $('setting-inv-address')?.value || '';
  $('sip-email').textContent = $('setting-email')?.value || '';
  $('sip-phone').textContent = $('setting-phone')?.value || '';
}
['setting-brand','setting-inv-address','setting-email','setting-phone'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', updateSIP); });
$('btn-save-settings')?.addEventListener('click', async () => {
  const payload = { brand:$('setting-brand').value, tagline:$('setting-tagline').value, location:$('setting-location').value, invAddress:$('setting-inv-address').value, email:$('setting-email').value, phone:$('setting-phone').value, bankName:$('setting-bank-name').value, accName:$('setting-acc-name').value, accNo:$('setting-acc-no').value, social:$('setting-social').value, notes:$('setting-notes').value };
  try { await api.put('/settings', payload); Object.assign(app.settings, payload); showToast('Settings saved!'); updateTopBar(); }
  catch (e) { showToast('Save failed: ' + e.message); }
});

// ── Form Modal ────────────────────────────────────────────────────
function populateRoomSelect() { const sel = $('form-room'); if (!sel) return; sel.innerHTML = ''; app.rooms.forEach(r => { sel.innerHTML += `<option value="${r.id}">${r.name}</option>`; }); }
function calcFormSummary() {
  const ci = $('form-checkin').value, co = $('form-checkout').value;
  const rate = +$('form-price').value||0, cleaning = +$('form-cleaning').value||0, deposit = +$('form-deposit').value||0, taxPct = +$('form-tax').value||0;
  const n = (ci && co) ? nightsCount(ci, co) : 1; const acc = n * rate, taxAmt = Math.round((acc + cleaning) * taxPct / 100), total = acc + cleaning + deposit + taxAmt;
  $('fs-rate').textContent = idr(rate); $('fs-nights-label').textContent = n + ' night' + (n>1?'s':''); $('fs-nights-count').textContent = n;
  $('fs-accommodation').textContent = idr(acc); $('fs-cleaning').textContent = cleaning>0?idr(cleaning):'—';
  $('fs-deposit').textContent = deposit>0?idr(deposit):'—'; $('fs-tax').textContent = taxPct>0?idr(taxAmt):'—'; $('fs-total').textContent = idr(total);
}
function openForm(type, dateStr, prefillId) {
  populateRoomSelect();
  if (prefillId) {
    const b = app.bookings.find(x => x.id === prefillId); if (!b) return;
    $('form-modal-title').textContent = 'Edit ' + b.id;
    $('form-name').value = b.guestName||''; $('form-email').value = b.guestEmail||''; $('form-phone').value = b.phone||''; $('form-guests').value = b.numGuests||1; $('form-address').value = b.address||'';
    $('form-room').value = b.room; $('form-checkin').value = b.checkin; $('form-checkout').value = b.checkout; $('form-checkin-time').value = b.checkinTime||'14:00'; $('form-checkout-time').value = b.checkoutTime||'12:00';
    $('form-price').value = b.rate; $('form-cleaning').value = b.cleaningFee||0; $('form-deposit').value = b.deposit||0; $('form-tax').value = b.tax||0; $('form-notes').value = b.notes||''; $('booking-form').dataset.editId = prefillId;
  } else {
    $('form-modal-title').textContent = type==='booking'?'New Booking':'New Quotation';
    $('booking-form').reset(); $('booking-form').dataset.editId = '';
    $('form-checkin').value = dateStr||fmt(today); $('form-checkout').value = fmt(addD(new Date($('form-checkin').value), 1));
    $('form-price').value = getRoomRate($('form-room').value||app.rooms[0]?.id||'r1'); $('form-guests').value=1; $('form-cleaning').value=0; $('form-deposit').value=0; $('form-tax').value=0; $('form-checkin-time').value='14:00'; $('form-checkout-time').value='12:00';
  }
  currentFormAction = type; calcFormSummary(); $('form-modal').classList.add('active');
}
['form-checkin','form-checkout','form-price','form-cleaning','form-deposit','form-tax'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', calcFormSummary); });
$('form-room')?.addEventListener('change', () => { $('form-price').value = getRoomRate($('form-room').value); calcFormSummary(); });
$('btn-create-booking-form')?.addEventListener('click', () => { lastAction = 'booking'; });
$('btn-create-quotation-form')?.addEventListener('click', () => { lastAction = 'quotation'; });
$('booking-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const ci = $('form-checkin').value, co = $('form-checkout').value;
  if (new Date(co) <= new Date(ci)) { showToast('Check-out must be after check-in.'); return; }
  const editId = $('booking-form').dataset.editId; const isBooking = lastAction === 'booking';
  const data = { type:isBooking?'invoice':'quotation', guestName:$('form-name').value, guestEmail:$('form-email').value, phone:$('form-phone').value, address:$('form-address').value, numGuests:+$('form-guests').value||1, room:$('form-room').value, checkin:ci, checkout:co, checkinTime:$('form-checkin-time').value||'14:00', checkoutTime:$('form-checkout-time').value||'12:00', rate:+$('form-price').value||310000, cleaningFee:+$('form-cleaning').value||0, deposit:+$('form-deposit').value||0, tax:+$('form-tax').value||0, notes:$('form-notes').value, status:isBooking?'awaiting':'quotation' };
  try {
    let res;
    if (editId) { await api.put(`/bookings/${editId}`, data); showToast('Booking updated!'); res = { id: editId }; }
    else { res = await api.post('/bookings', data); showToast((isBooking?'Booking':'Quotation')+' created!'); }
    $('form-modal').classList.remove('active'); await loadData(); openIPM(res.id || editId);
  } catch (e) { showToast('Save failed: ' + e.message); }
});
$('btn-new-booking')?.addEventListener('click', () => openForm('booking', null, null));
$('btn-new-quotation')?.addEventListener('click', () => openForm('quotation', null, null));
['btn-close-form','btn-cancel-form'].forEach(id => $(id)?.addEventListener('click', () => $('form-modal').classList.remove('active')));

// ── Invoice Preview Modal (IPM) ───────────────────────────────────
window.openIPM = function(id) {
  const b = app.bookings.find(x => x.id === id); if (!b) return; currentIPMId = id;
  const n = nightsCount(b.checkin, b.checkout); const acc = n * b.rate, taxAmt = Math.round((acc + b.cleaningFee) * (b.tax/100)), grandTotal = acc + b.cleaningFee + b.deposit + taxAmt;
  $('ipm-brand').textContent = app.settings.brand||'Terratjo Room'; $('ipm-brand-addr').textContent = app.settings.invAddress||'';
  const isExpiredQ = isExpired(b);
  const docLabel = b.status==='cancelled' ? 'CANCELLED' : (isExpiredQ ? 'EXPIRED QUOTATION' : (b.type==='quotation' ? 'QUOTATION' : 'INVOICE'));
  const docEl = $('ipm-doc-type'); docEl.textContent = docLabel;
  docEl.style.color = b.status==='cancelled' ? '#b91c1c' : (isExpiredQ ? '#6b7280' : 'var(--primary)');
  $('ipm-doc-date').textContent = 'Date: ' + shortDate(fmt(today));
  const stamp = $('ipm-cancelled-stamp'); b.status==='cancelled'?stamp.classList.remove('hidden'):stamp.classList.add('hidden');
  $('ipm-f-name').value = b.guestName||''; $('ipm-f-addr').value = b.address||''; $('ipm-meta-contact').textContent = (b.guestEmail||'') + (b.phone?' · '+b.phone:'');
  $('ipm-meta-room').textContent = (b.numGuests||1)+' guest'+(b.numGuests>1?'s':'')+' · Room: '+getRoomName(b.room);
  $('ipm-ci-date').value = b.checkin; $('ipm-ci-time').value = b.checkinTime||'14:00'; $('ipm-co-date').value = b.checkout; $('ipm-co-time').value = b.checkoutTime||'12:00'; $('ipm-duration').textContent = n+' Night'+(n>1?'s':'');
  $('ipm-t-nights').textContent = n+' night'+(n>1?'s':''); $('ipm-t-rate').value = b.rate; $('ipm-t-room-amt').textContent = idr(acc);
  $('ipm-t-cleaning').textContent = idr(b.cleaningFee); $('ipm-row-cleaning').classList.toggle('hidden', b.cleaningFee<=0);
  $('ipm-t-deposit').textContent = idr(b.deposit); $('ipm-row-deposit').classList.toggle('hidden', b.deposit<=0);
  $('ipm-t-tax').textContent = idr(taxAmt); $('ipm-row-tax').classList.toggle('hidden', b.tax<=0); $('ipm-t-grand').textContent = idr(grandTotal);
  $('ipm-bank-name').textContent = app.settings.bankName||''; $('ipm-acc-name').textContent = 'Account Name: '+(app.settings.accName||''); $('ipm-acc-no').textContent = 'Account No: '+(app.settings.accNo||'');
  const waIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="#000" style="vertical-align:middle;margin-right:5px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  const igIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" style="vertical-align:middle;margin-right:5px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
  $('ipm-c-phone').innerHTML = waIcon + (app.settings.phone||''); $('ipm-c-social').innerHTML = igIcon + (app.settings.social||'').replace(/^@/,''); $('ipm-footer-msg').textContent = app.settings.notes||'';
  const isCancelled = b.status==='cancelled';
  $('ipm-btn-cancel').style.display = isCancelled ? 'none' : '';
  $('ipm-btn-edit').style.display = isCancelled ? 'none' : '';
  $('ipm-btn-convert').style.display = b.status === 'quotation' ? '' : 'none';
  $('ipm-overlay').classList.add('active');
};
$('ipm-t-rate')?.addEventListener('input', () => {
  const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return;
  const n = nightsCount($('ipm-ci-date').value||b.checkin, $('ipm-co-date').value||b.checkout);
  const rate = +$('ipm-t-rate').value||0; const acc = n*rate; const taxAmt = Math.round((acc+b.cleaningFee)*(b.tax/100));
  $('ipm-t-room-amt').textContent = idr(acc); $('ipm-t-grand').textContent = idr(acc+b.cleaningFee+b.deposit+taxAmt);
});
function closeIPM() { $('ipm-overlay').classList.remove('active'); }
$('ipm-btn-x')?.addEventListener('click', closeIPM); $('ipm-btn-close')?.addEventListener('click', closeIPM);
$('ipm-overlay')?.addEventListener('click', e => { if (e.target.id==='ipm-overlay') closeIPM(); });
$('ipm-btn-cancel')?.addEventListener('click', async () => {
  const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return;
  if (!confirm('Mark this booking as cancelled?')) return;
  try { await api.del(`/bookings/${b.id}`); showToast('Booking marked as cancelled.'); await loadData(); closeIPM(); refreshCurrentPage(); }
  catch (e) { showToast('Cancel failed: ' + e.message); }
});
$('ipm-btn-delete')?.addEventListener('click', async () => {
  const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return;
  if (!confirm(`⚠️ Permanently delete booking ${b.id}? This cannot be undone.`)) return;
  try { await api.del(`/bookings/${b.id}/permanent`); showToast('Booking permanently deleted.'); await loadData(); closeIPM(); refreshCurrentPage(); }
  catch (e) { showToast('Delete failed: ' + e.message); }
});
$('ipm-btn-edit')?.addEventListener('click', () => { const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return; closeIPM(); openForm(b.type==='quotation'?'quotation':'booking', null, currentIPMId); });
$('ipm-btn-email')?.addEventListener('click', () => {
  const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return;
  const sub = encodeURIComponent((b.type==='quotation'?'Quotation':'Booking')+' '+b.id+' – Terratjo Room');
  const body = encodeURIComponent('Dear '+b.guestName+',\n\nThank you for choosing Terratjo Room.\n\nBest regards,\nTerratjo Room Team');
  window.open('mailto:'+(b.guestEmail||'')+'?subject='+sub+'&body='+body); showToast('Email client opened!');
});
$('ipm-btn-print')?.addEventListener('click', () => printInvoice());
$('ipm-btn-convert')?.addEventListener('click', async () => {
  const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return;
  if (!confirm('Mark this quotation as paid and convert to Invoice?')) return;
  try {
    await api.put(`/bookings/${b.id}`, { ...b, type:'invoice', status:'confirmed' });
    showToast('Converted to Invoice ✓');
    await loadData(); openIPM(b.id); refreshCurrentPage();
  } catch(e) { showToast('Conversion failed: ' + e.message); }
});

// ── Data Load & Init ──────────────────────────────────────────────
async function loadData() {
  const [s, r, b] = await Promise.all([api.get('/settings'), api.get('/rooms'), api.get('/bookings')]);
  Object.assign(app.settings, s); app.rooms = r; app.bookings = b;
}
async function initApp() {
  if (!token) { showLogin(); return; }
  try {
    await loadData();
    lucide.createIcons(); populateRoomSelect(); updateTopBar(); navigate(prevPage);
    applyLogo(app.settings.logo || '');
    initSSE();
  } catch (e) { console.error('Init failed:', e); showToast('Failed to load data. Check backend.'); logout(); }
}
function updateTopBar() {
  if ($('topbar-brand')) $('topbar-brand').textContent = (app.settings.brand||'Terratjo') + ' Booking Portal';
  if ($('topbar-location')) $('topbar-location').textContent = app.settings.location||'';
  if ($('sidebar-brand-name')) $('sidebar-brand-name').textContent = app.settings.brand||'Terratjo Room';
}

// ── Logo Upload ───────────────────────────────────────────────────
function applyLogo(dataUrl) {
  const imgTag = dataUrl
    ? `<img src="${dataUrl}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;">`
    : `<i data-lucide="home"></i>`;

  ['sidebar-logo-box','settings-logo-circle','sip-logo-box','ipm-logo-circle'].forEach(id => {
    const el = $(id); if (el) el.innerHTML = imgTag;
  });

  const removeBtn = $('btn-remove-logo');
  if (removeBtn) removeBtn.style.display = dataUrl ? 'inline-flex' : 'none';

  const hintTitle = document.querySelector('.logo-upload-hint-title');
  if (hintTitle) hintTitle.textContent = dataUrl ? 'Click to change logo' : 'Click to upload logo';

  if (!dataUrl) lucide.createIcons();
}

function triggerLogoUpload() { $('logo-upload')?.click(); }

// Attach click listeners to all logo spots
['sidebar-logo-box','sip-logo-box','ipm-logo-circle'].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener('click', triggerLogoUpload);
});
// Settings area uses its own onclick in HTML (kept for that area only)
$('settings-logo-box')?.addEventListener('click', triggerLogoUpload);

async function removeLogo() {
  if (!confirm('Remove the custom logo and restore the default?')) return;
  try {
    await api.put('/settings', { ...app.settings, logo: '' });
    app.settings.logo = '';
    applyLogo('');
    showToast('Logo removed.');
  } catch (e) { showToast('Failed to remove logo: ' + e.message); }
}
window.removeLogo = removeLogo;

$('logo-upload')?.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { showToast('Image too large — please use a file under 3MB.'); this.value = ''; return; }
  const reader = new FileReader();
  reader.onload = async e => {
    const dataUrl = e.target.result;
    try {
      await api.put('/settings', { ...app.settings, logo: dataUrl });
      app.settings.logo = dataUrl;
      applyLogo(dataUrl);
      showToast('✅ Logo updated successfully!');
    } catch (err) { showToast('Failed to save logo: ' + err.message); }
  };
  reader.readAsDataURL(file);
  this.value = '';
});

// ── Change Password ───────────────────────────────────────────────
document.addEventListener('click', async e => {
  if (!e.target.closest('#btn-change-password')) return;
  const current = $('pw-current')?.value?.trim();
  const nw      = $('pw-new')?.value?.trim();
  const confirm = $('pw-confirm')?.value?.trim();
  if (!current || !nw || !confirm) { showToast('Please fill in all password fields.'); return; }
  if (nw.length < 6) { showToast('New password must be at least 6 characters.'); return; }
  if (nw !== confirm) { showToast('New passwords do not match.'); return; }
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: current, newPassword: nw })
    });
    const data = await res.json();
    if (!res.ok) { showToast('❌ ' + (data.error || 'Failed to change password')); return; }
    showToast('✅ Password changed! Please log in again.');
    $('pw-current').value = ''; $('pw-new').value = ''; $('pw-confirm').value = '';
    setTimeout(() => logout(), 2000);
  } catch (err) { showToast('Error: ' + err.message); }
});

// ── Print / PDF Invoice ──────────────────────────────────────────
function printInvoice() {
  const b = app.bookings.find(x => x.id === currentIPMId);
  const s = app.settings || {};
  if (!b) return;
  const roomObj = app.rooms.find(r => r.id === b.room);
  const roomName = roomObj ? roomObj.name : b.room;
  const nights = Math.max(1, Math.round((new Date(b.checkout) - new Date(b.checkin)) / 86400000));
  const roomAmt = nights * (b.rate || 0);
  const taxAmt = Math.round((roomAmt + (b.cleaningFee || 0)) * ((b.tax || 0) / 100));
  const grand = roomAmt + (b.cleaningFee || 0) + (b.deposit || 0) + taxAmt;
  const fmtMoney = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const todayStr = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'})).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const type = (b.type || 'booking').toUpperCase();
  const logoHtml = s.logo
    ? '<img src="'+s.logo+'" style="width:56px;height:56px;border-radius:12px;object-fit:cover">'
    : '<div style="width:56px;height:56px;border-radius:12px;background:#ffc823;display:flex;align-items:center;justify-content:center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>';
  const win = window.open('', '_blank', 'width=860,height=1050');
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Terratjo '+type+'</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,Arial,sans-serif;font-size:13px;color:#1a1a2e;background:#fff;padding:36px 44px}.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #f0f0f0}.brand{display:flex;align-items:center;gap:14px}.bn{font-family:"Playfair Display",serif;font-size:22px;font-weight:700}.bs{font-size:12px;color:#888;margin-top:2px}.dt{font-family:"Playfair Display",serif;font-size:30px;font-weight:700;color:#ffc823;text-align:right}.dm{font-size:11px;color:#666;margin-top:4px;text-align:right}h3{font-size:13px;font-weight:700;margin:16px 0 8px;padding-bottom:5px;border-bottom:1px solid #f0f0f0}.lbl{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#888;margin-bottom:2px}.val{font-size:15px;font-weight:700;padding-bottom:6px;border-bottom:1.5px solid #ffc823;margin-bottom:10px}.vsm{font-size:13px;padding-bottom:5px;border-bottom:1px solid #eee;margin-bottom:10px}.meta{font-size:12px;color:#555;margin-bottom:3px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}hr{border:none;border-top:1px solid #f0f0f0;margin:16px 0}table{width:100%;border-collapse:collapse;margin:8px 0}thead tr{background:#1a1a2e}thead th{padding:8px 12px;font-size:11px;font-weight:600;color:#fff;text-align:left;text-transform:uppercase}tbody td{padding:7px 12px;font-size:12px;border-bottom:1px solid #f0f0f0}tbody tr:nth-child(even){background:#fafafa}.tt{background:#1a1a2e!important}.tt td{color:#ffc823;font-weight:700;font-size:13px;border:none}.pay{display:flex;justify-content:space-between;align-items:flex-start;border-top:1px solid #eee;padding-top:14px;margin-top:14px}.pl{font-weight:700;font-size:12px;margin-bottom:6px}.pm{font-size:11px;color:#444;margin-bottom:3px}.nb{background:#fffbeb;border-left:3px solid #ffc823;border-radius:4px;padding:10px 14px;font-size:12px;margin:12px 0}footer{text-align:center;padding-top:12px;border-top:1px solid #eee;margin-top:12px;font-size:11px;color:#999}@media print{body{padding:10mm 12mm}@page{size:A4 portrait;margin:0}}</style></head><body>'
    + '<div class="hdr"><div class="brand">'+logoHtml+'<div><div class="bn">'+(s.brand||'Terratjo Room')+'</div><div class="bs">'+(s.invAddress||'')+'</div></div></div>'
    + '<div><div class="dt">'+type+'</div><div class="dm">Date: '+todayStr+'</div></div></div>'
    + '<h3>Guest Information</h3>'
    + '<div class="lbl">Guest Name</div><div class="val">'+(b.guestName||'-')+'</div>'
    + '<div class="lbl">Address</div><div class="vsm">'+(b.address||'-')+'</div>'
    + '<div class="meta">'+(b.guestEmail||'')+' · '+(b.phone||'')+'</div>'
    + '<div class="meta">'+(b.numGuests||1)+' guest(s) · Room: '+roomName+'</div>'
    + '<hr><h3>Stay Details</h3>'
    + '<div class="g2"><div><div class="lbl">Check-In</div><div class="vsm">'+fmtDate(b.checkin)+' at '+(b.checkinTime||'14:00')+'</div></div>'
    + '<div><div class="lbl">Check-Out</div><div class="vsm">'+fmtDate(b.checkout)+' at '+(b.checkoutTime||'12:00')+'</div></div></div>'
    + '<div class="meta" style="font-weight:600;margin-top:4px">Duration: '+nights+' night(s)</div>'
    + '<hr><h3>Pricing Details</h3>'
    + '<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>'
    + '<tr><td>Room Rate</td><td>'+nights+' night(s)</td><td>'+fmtMoney(b.rate)+'</td><td>'+fmtMoney(roomAmt)+'</td></tr>'
    + ((b.cleaningFee||0)>0 ? '<tr><td>Cleaning Fee</td><td>1</td><td>-</td><td>'+fmtMoney(b.cleaningFee)+'</td></tr>' : '')
    + ((b.deposit||0)>0 ? '<tr><td>Deposit</td><td>1</td><td>-</td><td>'+fmtMoney(b.deposit)+'</td></tr>' : '')
    + ((b.tax||0)>0 ? '<tr><td>Tax ('+b.tax+'%)</td><td>-</td><td>-</td><td>'+fmtMoney(taxAmt)+'</td></tr>' : '')
    + '<tr class="tt"><td colspan="3"><b>Total Amount</b></td><td><b>'+fmtMoney(grand)+'</b></td></tr>'
    + '</tbody></table>'
    + (b.notes ? '<div class="nb"><b>Notes / Special Requests:</b> '+b.notes+'</div>' : '')
    + '<div class="pay"><div><div class="pl">Payment Info:</div><div class="pm">'+(s.bankName||'')+'</div>'
    + '<div class="pm">Account Name: '+(s.accName||'')+'</div><div class="pm">Account No: '+(s.accNo||'')+'</div></div>'
    + '<div style="text-align:right"><div class="pl">Contact us at:</div>'
    + '<div class="pm"><svg width="13" height="13" viewBox="0 0 24 24" fill="#000" style="vertical-align:middle;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'+(s.phone||'')+'</div>'
    + '<div class="pm"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'+(s.social||'').replace(/^@/,'')+' </div></div></div>'
    + '<footer>'+(s.notes||'Thank you for your booking.')+'</footer>'
    + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},400);};<'+'/scr'+'ipt>'
    + '</body></html>';
  win.document.write(html);
  win.document.close();
}
window.printInvoice = printInvoice;
