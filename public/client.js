// ── Auth & State ────────────────────────────────────────────────
const API = '/api';
const app = { settings: {}, rooms: [], bookings: [], promos: [] };
let token = localStorage.getItem('terratjo_token');
let currentFormAction = 'booking', currentIPMId = null, prevPage = 'calendar', lastAction = 'booking';
// Get today's date in Jakarta / WIB (UTC+7) — Intl.DateTimeFormat is the only reliable cross-browser method
const _todayJkt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()); // → "YYYY-MM-DD"
const [_jY, _jM0, _jD] = _todayJkt.split('-').map(Number); // _jM0 is 1-indexed
const today = new Date(_jY, _jM0 - 1, _jD); // local midnight Date (getFullYear/Month/Date work correctly)
let calYear = _jY, calMonth = _jM0 - 1; // calMonth is 0-indexed

// ── i18n (Language) ─────────────────────────────────────────────
const LANG = {
  en: {
    'nav.calendar':'Calendar','nav.bookings':'All Bookings','nav.invoices':'Invoices & Quotes',
    'nav.reports':'Reports','nav.inventory':'Inventory','nav.settings':'Settings',
    'nav.header.documents':'DOCUMENTS','nav.header.analytics':'ANALYTICS',
    'nav.header.property':'PROPERTY','nav.header.language':'LANGUAGE',
    'btn.new-booking':'New Booking','btn.new-quotation':'New Quotation','btn.cancel':'Cancel',
    'login.username':'USERNAME','login.password':'PASSWORD','login.signin':'Sign In',
    'login.subtitle':'Booking Portal \u2014 Staff Access',
    'settings.title':'Property Settings',
    'settings.subtitle':'These details will appear on all invoices and quotations.',
    'settings.save':'Save Settings',
    'sec.title':'\uD83D\uDD10 Security','sec.subtitle':'Change your login password. Use a strong password with letters, numbers and symbols.',
    'sec.current':'Current Password','sec.new':'New Password','sec.confirm':'Confirm New Password','sec.btn':'Change Password',
    'promo.title':'\uD83C\uDF89 Promo Management',
    'promo.subtitle':'Set discounts by room and period. Staff selects promos when creating bookings.',
    'promo.add':'Add Promo',
    'form.name':'GUEST FULL NAME','form.email':'EMAIL','form.phone':'PHONE / WHATSAPP',
    'form.guests':'NO. OF GUESTS','form.address':'GUEST ADDRESS','form.room':'ROOM',
    'form.checkin-date':'CHECK-IN DATE','form.checkin-time':'CHECK-IN TIME',
    'form.checkout-date':'CHECK-OUT DATE','form.checkout-time':'CHECK-OUT TIME',
    'form.rate':'RATE / NIGHT (RP)','form.cleaning':'CLEANING FEE (RP)',
    'form.deposit':'DEPOSIT (RP)','form.tax':'TAX (%)','form.notes':'NOTES / SPECIAL REQUESTS',
    'fs.rate':'Rate per night','fs.night':'night','fs.accommodation':'Accommodation',
    'fs.cleaning':'Cleaning fee','fs.additional':'Additional fee','fs.deposit':'Deposit','fs.tax':'Tax','fs.total':'Total',
      
    'th.guest':'GUEST', 'th.room':'ROOM', 'th.checkin':'CHECK-IN', 'th.checkout':'CHECK-OUT', 'th.nights':'NIGHTS', 'th.total':'TOTAL', 'th.status':'STATUS', 'th.type':'TYPE', 'th.dates':'DATES', 'th.rate':'RATE/NIGHT', 'th.desc':'Description', 'th.qty':'Quantity', 'th.amount':'Amount',
    'lbl.night':'night', 'lbl.nights':'nights', 'lbl.no_bookings':'No bookings found.', 'lbl.no_documents':'No documents found.',
    'st.confirmed':'Confirmed', 'st.awaiting':'Awaiting Payment', 'st.quotation':'Quotation', 'st.cancelled':'Cancelled', 'st.expired':'Expired', 'st.invoice':'Invoice',
    'rep.rev':'Total Revenue', 'rep.from_bookings':'from bookings', 'rep.confirmed':'Confirmed', 'rep.bookings':'bookings', 'rep.awaiting':'Awaiting Payment', 'rep.need_follow':'need follow-up', 'rep.quotations':'Quotations', 'rep.cancelled_exp':'cancelled/expired',
    'inv.max':'Max', 'inv.guests':'guests', 'inv.night':'night', 'inv.edit':'Edit', 'inv.delete':'Delete', 'inv.add_room':'Add Room',
    'cal.jan':'January', 'cal.feb':'February', 'cal.mar':'March', 'cal.apr':'April', 'cal.may':'May', 'cal.jun':'June', 'cal.jul':'July', 'cal.aug':'August', 'cal.sep':'September', 'cal.oct':'October', 'cal.nov':'November', 'cal.dec':'December',
    'cal.su':'Su', 'cal.mo':'Mo', 'cal.tu':'Tu', 'cal.we':'We', 'cal.th':'Th', 'cal.fr':'Fr', 'cal.sa':'Sa',
    'btn.preview': 'Preview', 'btn.view': 'View'
  
  ,    
    'st.cancelled_exp':'Cancelled/Expired',
    'tab.all':'All', 'tab.quotations':'Quotations', 'tab.invoices':'Invoices', 'tab.bookings':'Bookings',
    'rep.trans_overview':'Transaction Overview',
    'inv.title':'Rooms / Inventory', 'inv.add_room':'Add Room', 'inv.edit_room':'Edit Room',
    'inv.lbl_name':'Room Name', 'inv.lbl_loc':'Location', 'inv.lbl_cap':'Capacity (Max Guests)', 'inv.lbl_rate':'Rate per night (Rp)', 'inv.lbl_desc':'Description', 'inv.save':'Save Room',
    'set.logo':'PROPERTY LOGO', 'set.logo_hint':'Click to upload logo', 'set.logo_sub':'PNG, JPG or SVG · Recommended 200x200px', 'set.logo_rm':'Remove Logo',
    'set.brand':'Brand / Property Name', 'set.tagline':'Tagline / Sub-brand', 'set.loc':'Location / Address (Top Bar)', 'set.inv_add':'Invoice Header Address',
    'set.email':'Contact Email', 'set.phone':'Contact Phone / WA', 'set.web':'Website (Optional)', 'set.bank':'Bank Name', 'set.acc_no':'Account Number', 'set.acc_name':'Account Holder Name', 'set.terms':'Payment Instructions / Terms',
    'set.msg':'Thank You Message (Invoice Footer)', 'set.inv_prev':'Invoice Header Preview'
  
  ,    
    'th.discount':'DISCOUNT', 'th.period':'PERIOD',
    'promo.ongoing':'Ongoing', 'promo.scheduled':'Scheduled', 'promo.inactive':'Inactive', 'promo.all_rooms':'All Rooms'
  
  ,    
    'promo.lbl_desc':'PROMO DESCRIPTION', 'promo.lbl_type':'DISCOUNT TYPE', 'promo.lbl_room':'APPLY TO ROOM', 'promo.lbl_start':'START DATE', 'promo.lbl_end':'END DATE',
    'promo.type_perc':'Percentage (%)', 'promo.type_fixed':'Fixed Amount (Rp)',
    'promo.val_perc':'DISCOUNT (%)', 'promo.val_fixed':'DISCOUNT AMOUNT (RP)'
  
  },
  id: {
    'nav.calendar':'Kalender','nav.bookings':'Semua Pemesanan','nav.invoices':'Faktur & Penawaran',
    'nav.reports':'Laporan','nav.inventory':'Inventaris','nav.settings':'Pengaturan',
    'nav.header.documents':'DOKUMEN','nav.header.analytics':'ANALITIK',
    'nav.header.property':'PROPERTI','nav.header.language':'BAHASA',
    'btn.new-booking':'Pemesanan Baru','btn.new-quotation':'Penawaran Baru','btn.cancel':'Batal',
    'login.username':'NAMA PENGGUNA','login.password':'KATA SANDI','login.signin':'Masuk',
    'login.subtitle':'Portal Pemesanan \u2014 Akses Staf',
    'settings.title':'Pengaturan Properti',
    'settings.subtitle':'Detail ini akan muncul di semua faktur dan penawaran.',
    'settings.save':'Simpan Pengaturan',
    'sec.title':'\uD83D\uDD10 Keamanan','sec.subtitle':'Ubah kata sandi masuk Anda. Gunakan kata sandi kuat dengan huruf, angka, dan simbol.',
    'sec.current':'Kata Sandi Saat Ini','sec.new':'Kata Sandi Baru','sec.confirm':'Konfirmasi Kata Sandi Baru','sec.btn':'Ubah Kata Sandi',
    'promo.title':'\uD83C\uDF89 Manajemen Promo',
    'promo.subtitle':'Atur diskon berdasarkan kamar dan periode. Staf memilih promo saat membuat pemesanan.',
    'promo.add':'Tambah Promo',
    'form.name':'NAMA LENGKAP TAMU','form.email':'EMAIL','form.phone':'TELEPON / WHATSAPP',
    'form.guests':'JUMLAH TAMU','form.address':'ALAMAT TAMU','form.room':'KAMAR',
    'form.checkin-date':'TANGGAL CHECK-IN','form.checkin-time':'WAKTU CHECK-IN',
    'form.checkout-date':'TANGGAL CHECK-OUT','form.checkout-time':'WAKTU CHECK-OUT',
    'form.rate':'TARIF / MALAM (RP)','form.cleaning':'BIAYA KEBERSIHAN (RP)',
    'form.deposit':'DEPOSIT (RP)','form.tax':'PAJAK (%)','form.notes':'CATATAN / PERMINTAAN KHUSUS',
    'fs.rate':'Tarif per malam','fs.night':'malam','fs.accommodation':'Akomodasi',
    'fs.cleaning':'Biaya kebersihan','fs.additional':'Biaya tambahan','fs.deposit':'Deposit','fs.tax':'Pajak','fs.total':'Total',
      
    'th.guest':'TAMU', 'th.room':'KAMAR', 'th.checkin':'CHECK-IN', 'th.checkout':'CHECK-OUT', 'th.nights':'MALAM', 'th.total':'TOTAL', 'th.status':'STATUS', 'th.type':'TIPE', 'th.dates':'TANGGAL', 'th.rate':'TARIF/MALAM', 'th.desc':'Deskripsi', 'th.qty':'Jumlah', 'th.amount':'Jumlah',
    'lbl.night':'malam', 'lbl.nights':'malam', 'lbl.no_bookings':'Tidak ada pemesanan ditemukan.', 'lbl.no_documents':'Tidak ada dokumen ditemukan.',
    'st.confirmed':'Terkonfirmasi', 'st.awaiting':'Menunggu Pembayaran', 'st.quotation':'Penawaran', 'st.cancelled':'Dibatalkan', 'st.expired':'Kedaluwarsa', 'st.invoice':'Faktur',
    'rep.rev':'Total Pendapatan', 'rep.from_bookings':'dari pemesanan', 'rep.confirmed':'Terkonfirmasi', 'rep.bookings':'pemesanan', 'rep.awaiting':'Menunggu Pembayaran', 'rep.need_follow':'perlu ditindaklanjuti', 'rep.quotations':'Penawaran', 'rep.cancelled_exp':'dibatalkan/kedaluwarsa',
    'inv.max':'Maks', 'inv.guests':'tamu', 'inv.night':'malam', 'inv.edit':'Ubah', 'inv.delete':'Hapus', 'inv.add_room':'Tambah Kamar',
    'cal.jan':'Januari', 'cal.feb':'Februari', 'cal.mar':'Maret', 'cal.apr':'April', 'cal.may':'Mei', 'cal.jun':'Juni', 'cal.jul':'Juli', 'cal.aug':'Agustus', 'cal.sep':'September', 'cal.oct':'Oktober', 'cal.nov':'November', 'cal.dec':'Desember',
    'cal.su':'Mg', 'cal.mo':'Sn', 'cal.tu':'Sl', 'cal.we':'Rb', 'cal.th':'Km', 'cal.fr':'Jm', 'cal.sa':'Sb',
    'btn.preview': 'Pratinjau', 'btn.view': 'Lihat'
  
  ,    
    'st.cancelled_exp':'Dibatalkan/Kedaluwarsa',
    'tab.all':'Semua', 'tab.quotations':'Penawaran', 'tab.invoices':'Faktur', 'tab.bookings':'Pemesanan',
    'rep.trans_overview':'Ringkasan Transaksi',
    'inv.title':'Kamar / Inventaris', 'inv.add_room':'Tambah Kamar', 'inv.edit_room':'Ubah Kamar',
    'inv.lbl_name':'Nama Kamar', 'inv.lbl_loc':'Lokasi', 'inv.lbl_cap':'Kapasitas (Maks Tamu)', 'inv.lbl_rate':'Tarif per malam (Rp)', 'inv.lbl_desc':'Deskripsi', 'inv.save':'Simpan Kamar',
    'set.logo':'LOGO PROPERTI', 'set.logo_hint':'Klik untuk mengunggah logo', 'set.logo_sub':'PNG, JPG, atau SVG · Disarankan 200x200px', 'set.logo_rm':'Hapus Logo',
    'set.brand':'Nama Merek / Properti', 'set.tagline':'Slogan / Sub-merek', 'set.loc':'Lokasi / Alamat (Top Bar)', 'set.inv_add':'Alamat Kop Faktur',
    'set.email':'Email Kontak', 'set.phone':'Telepon / WA', 'set.web':'Situs Web (Opsional)', 'set.bank':'Nama Bank', 'set.acc_no':'Nomor Rekening', 'set.acc_name':'Nama Pemilik Rekening', 'set.terms':'Instruksi / Syarat Pembayaran',
    'set.msg':'Pesan Terima Kasih (Footer Faktur)', 'set.inv_prev':'Pratinjau Kop Faktur'
  
  ,    
    'th.discount':'DISKON', 'th.period':'PERIODE',
    'promo.ongoing':'Berlangsung', 'promo.scheduled':'Dijadwalkan', 'promo.inactive':'Tidak Aktif', 'promo.all_rooms':'Semua Kamar'
  
  ,    
    'promo.lbl_desc':'DESKRIPSI PROMO', 'promo.lbl_type':'TIPE DISKON', 'promo.lbl_room':'TERAPKAN PADA KAMAR', 'promo.lbl_start':'TANGGAL MULAI', 'promo.lbl_end':'TANGGAL BERAKHIR',
    'promo.type_perc':'Persentase (%)', 'promo.type_fixed':'Nominal Tetap (Rp)',
    'promo.val_perc':'DISKON (%)', 'promo.val_fixed':'NOMINAL DISKON (RP)'
  
  }
};
let currentLang = localStorage.getItem('terratjo_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('terratjo_lang', lang);
  const tArr = LANG[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (tArr[key] !== undefined) el.textContent = tArr[key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang || btn.textContent.trim() === lang.toUpperCase());
  });
  if (typeof refreshCurrentPage === 'function') refreshCurrentPage();
  if (typeof renderCalendar === 'function') renderCalendar();
}
window.setLanguage = setLanguage;
window.t = function(key) { return (LANG[currentLang] && LANG[currentLang][key]) || (LANG['en'] && LANG['en'][key]) || key; };

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
const calcTotal = b => { const n = nightsCount(b.checkin, b.checkout); const acc = n * b.rate; const tax = Math.round((acc + b.cleaningFee + (b.additionalFee||0)) * (b.tax / 100)); const promo = b.promoId ? app.promos.find(p => p.id === b.promoId) : null; const disc = promo ? (promo.type === 'percentage' ? Math.round(acc * promo.value / 100) : Math.min(Number(promo.value), acc)) : 0; return acc + b.cleaningFee + (b.additionalFee||0) + b.deposit + tax - disc; };
const todayStr = _todayJkt; // Already "YYYY-MM-DD" in Jakarta timezone — no toISOString() UTC drift
// isExpired: true if server already set status='expired', OR quotation check-in date has passed
const isExpired = b => b.status === 'expired' || (b.status === 'quotation' && b.checkin < todayStr);
const effStatus = b => isExpired(b) ? 'expired' : b.status;
// Promo helpers
const promoStatus = p => { const today = todayStr; if (!p.startDate || !p.endDate) return 'inactive'; if (today < p.startDate) return 'scheduled'; if (today > p.endDate) return 'inactive'; return 'ongoing'; };
const calcPromoDiscount = (promo, acc) => !promo ? 0 : promo.type === 'percentage' ? Math.round(acc * promo.value / 100) : Math.min(Number(promo.value), acc);

function showToast(msg) { const toastEl = $('toast'); toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 2800); }
function statusBadge(s) { const m = { confirmed:'badge-confirmed', awaiting:'badge-awaiting', quotation:'badge-quotation', cancelled:'badge-cancelled', expired:'badge-expired' }; const l = { confirmed:t('st.confirmed'), awaiting:t('st.awaiting'), quotation:t('st.quotation'), cancelled:t('st.cancelled'), expired:t('st.expired') }; return `<span class="badge ${m[s]||''}">${l[s]||s}</span>`; }
function typeBadge(typeVal) { return typeVal === 'quotation' ? `<span class="badge badge-quotation">${t('st.quotation')}</span>` : `<span class="badge badge-invoice">${t('st.invoice')}</span>`; }

// ── Auth UI ─────────────────────────────────────────────────────
function showLogin() { const o = $('login-overlay'); if (o) o.classList.add('active'); setLanguage(currentLang); }
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

  // ── Logo: apply cached instantly → fetch fresh → cache for next load ──
  const _logoImg = document.getElementById('login-logo-img');
  const _cachedLogo = localStorage.getItem('terratjo_logo_cache');
  if (_cachedLogo && _logoImg) {
    _logoImg.src = _cachedLogo; // instant — no flash
  } else if (_logoImg) {
    _logoImg.style.opacity = '0'; // hide wrong static logo until correct one loads
  }
  fetch('/api/logo').then(r => r.json()).then(d => {
    if (d.logo) {
      localStorage.setItem('terratjo_logo_cache', d.logo);
      if (_logoImg) { _logoImg.src = d.logo; _logoImg.style.opacity = '1'; }
    } else if (_logoImg) { _logoImg.style.opacity = '1'; }
  }).catch(() => { if (_logoImg) _logoImg.style.opacity = '1'; });

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
function navigate(pageId) {
  if (pageId === 'calendar') renderCalendar();
  if (pageId === 'all-bookings') renderBookings(_currentBookingFilter);
  if (pageId === 'invoices') renderInvoices(_currentInvoiceFilter);
  if (pageId === 'reports') renderReports('all');
  if (pageId === 'inventory') renderInventory();
  if (pageId === 'settings') renderSettings();
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
  const p = $('page-' + pageId); if (p) p.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`[data-page="${pageId}"]`); if (el) el.classList.add('active');
  if (window.innerWidth <= 1000) closeSidebar();
  prevPage = pageId;
}
// Search Logic
function handleSearch(e) {
  _currentSearch = e.target.value.toLowerCase().trim();
  $('desktop-search-input').value = e.target.value;
  $('mobile-search-input').value = e.target.value;
  refreshCurrentPage();
  renderGlobalSearchResults();
}
$('desktop-search-input')?.addEventListener('input', handleSearch);
$('mobile-search-input')?.addEventListener('input', handleSearch);
$('btn-search-toggle')?.addEventListener('click', () => {
  const input = $('desktop-search-input');
  if (input.style.display === 'none') {
    input.style.display = 'block';
    input.focus();
  } else {
    input.style.display = 'none';
    input.value = '';
    _currentSearch = '';
    refreshCurrentPage();
    renderGlobalSearchResults();
  }
});
document.addEventListener('click', e => {
  try {
    if (!e.target || !e.target.closest) return;
    if (!e.target.closest('.desktop-search-wrapper') && !e.target.closest('.mobile-search-wrapper')) {
      const dDesk = $('desktop-search-results'), dMob = $('mobile-search-results');
      if (dDesk && !dDesk.classList.contains('hidden')) dDesk.classList.add('hidden');
      if (dMob && !dMob.classList.contains('hidden')) dMob.classList.add('hidden');
    }
  } catch(err) { console.error(err); }
});
function renderGlobalSearchResults() {
  const dDesk = $('desktop-search-results'), dMob = $('mobile-search-results');
  if (!dDesk || !dMob) return;
  const showDropdown = ['calendar', 'inventory', 'settings'].includes(prevPage);
  if (!_currentSearch || !showDropdown) { dDesk.classList.add('hidden'); dMob.classList.add('hidden'); return; }
  const matches = app.bookings.filter(b => (b.guestName||'').toLowerCase().includes(_currentSearch) || (b.id||'').toLowerCase().includes(_currentSearch));
  let html = '';
  if (matches.length === 0) { html = '<div class="sr-empty">No bookings found for "'+_currentSearch+'"</div>'; }
  else {
    matches.forEach(b => {
      const isExp = isExpired(b), st = b.status === 'cancelled' ? 'CANCELLED' : (isExp ? 'EXPIRED' : (b.type === 'quotation' ? 'QUOTATION' : 'INVOICE'));
      const badgeCls = b.status === 'cancelled' || isExp ? 'cancelled' : (b.type === 'quotation' ? 'quotation' : 'invoice');
      html += `<div class="search-result-item" onclick="openSearchResult('${b.id}')">
        <div class="sr-title"><span>${b.id}</span></div>
        <div class="sr-room"><span style="opacity:0.5; margin-right:4px;">&bull;</span> ${getRoomName(b.room)}</div>
        <div class="sr-sub"><i data-lucide="user" style="width:12px;height:12px;"></i> ${b.guestName||'No Name'}</div>
        <div class="sr-badge"><span class="badge ${badgeCls}">${st}</span></div>
      </div>`;
    });
  }
  dDesk.innerHTML = html; dMob.innerHTML = html;
  dDesk.classList.remove('hidden'); dMob.classList.remove('hidden');
  lucide.createIcons();
}
window.openSearchResult = function(id) {
  _currentSearch = ''; $('desktop-search-input').value = ''; $('mobile-search-input').value = '';
  if ($('desktop-search-input').style.display === 'block') $('desktop-search-input').style.display = 'none';
  $('desktop-search-results').classList.add('hidden'); $('mobile-search-results').classList.add('hidden');
  refreshCurrentPage();
  openIPM(id);
  if (window.innerWidth <= 1000) closeSidebar();
}
function setMbnActive(id) {
  document.querySelectorAll('.mbn-item').forEach(b => b.classList.remove('active'));
  const el = $(id); if (el) el.classList.add('active');
}
function refreshCurrentPage() {
  if (prevPage === 'calendar') renderCalendar();
  if (prevPage === 'all-bookings') renderBookings(_currentBookingFilter);
  if (prevPage === 'invoices') renderInvoices(_currentInvoiceFilter);
  if (prevPage === 'reports') renderReports('all');
  if (prevPage === 'inventory') renderInventory();
  if (prevPage === 'settings') renderSettings();
}
document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); }));

// ── Calendar ─────────────────────────────────────────────────────
function renderCalendar() {
  $('current-month-display').textContent = [t('cal.jan'),t('cal.feb'),t('cal.mar'),t('cal.apr'),t('cal.may'),t('cal.jun'),t('cal.jul'),t('cal.aug'),t('cal.sep'),t('cal.oct'),t('cal.nov'),t('cal.dec')][calMonth] + ' ' + calYear;
  const grid = $('days-grid'); if (!grid) return; grid.innerHTML = '';
  const first = new Date(calYear, calMonth, 1).getDay();
  const dim = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDim = new Date(calYear, calMonth, 0).getDate();
  // todayStr is the global Jakarta-timezone string — no local re-declaration needed
  for (let i = first - 1; i >= 0; i--) grid.innerHTML += `<div class="day-cell past"><div class="day-number inactive">${prevDim - i}</div></div>`;
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
    const isPast = ds < todayStr; grid.innerHTML += `<div class="day-cell ${isPast ? 'past' : ''}" data-date="${ds}"><div class="day-number ${cls}">${d}</div>${blks}</div>`;
  }
  const total = first + dim; const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= rem; i++) grid.innerHTML += `<div class="day-cell past"><div class="day-number inactive">${i}</div></div>`;
  document.querySelectorAll('.day-cell[data-date]').forEach(cell => cell.addEventListener('click', () => {
    if (window.innerWidth <= 1000) { showDayDetail(cell.dataset.date); }
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
$('current-month-display')?.addEventListener('click', ()=>{ if(window.innerWidth <= 1000) openMonthPicker(); });

// Booking filter select sync (desktop tabs stay active)
function applyBookingsFilter(val){
  renderBookings(val);
  document.querySelectorAll('#bookings-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===val));
}
window.applyBookingsFilter = applyBookingsFilter;

$('btn-prev-month').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
$('btn-next-month').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });

// ── Tables ───────────────────────────────────────────────────────
// ── Quotation status cell: countdown OR badge ───────────────────
// Active quotations → live countdown. Others → normal badge.
function quotaStatusCell(b) {
  const es = effStatus(b);
  if (b.status !== 'quotation') return statusBadge(es);
  if (es === 'expired') return statusBadge('expired');
  if (!b.createdAt) return statusBadge('quotation');
  // Fix: SQLite stores UTC as "YYYY-MM-DD HH:MM:SS" — append Z to parse as UTC
  const utcStr = b.createdAt.includes('T') ? b.createdAt : b.createdAt.replace(' ', 'T') + 'Z';
  const expiry = new Date(utcStr).getTime() + 6 * 60 * 60 * 1000;
  const rem = expiry - Date.now();
  if (rem <= 0) return statusBadge('expired');
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  // ≤ 30 min → red urgent; ≤ 3 h → orange warning; > 3h → normal
  const cls = rem < 30 * 60 * 1000 ? 'quota-cd quota-cd-urgent'
            : rem < 3 * 3600000    ? 'quota-cd quota-cd-warn'
            : 'quota-cd';
  return `<div class="${cls}" data-expiry="${expiry}">⏱ ${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s</div>`;
}

let _currentSearch = '', _currentBookingFilter = 'all', _currentInvoiceFilter = 'all';

function renderBookings(filter) {
  _currentBookingFilter = filter || 'all';
  const tb = $('bookings-tbody'); if (!tb) return;
  const rows = app.bookings.filter(b => {
    const match = !_currentSearch || (b.guestName||'').toLowerCase().includes(_currentSearch) || (b.id||'').toLowerCase().includes(_currentSearch);
    if (!match) return false;
    const es = effStatus(b);
    if (filter === 'all') return true;
    if (filter === 'cancelled') return b.status === 'cancelled' || es === 'expired';
    if (filter === 'quotation') return b.status === 'quotation' && es !== 'expired';
    // Awaiting Payment = awaiting invoices + active quotations (all quotations need payment)
    if (filter === 'awaiting') return b.status === 'awaiting' || (b.status === 'quotation' && es !== 'expired');
    return b.status === filter;
  });
  tb.innerHTML = '';
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-light)">No bookings found.</td></tr>`; return; }
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    tb.innerHTML += `<tr onclick="openIPM('${b.id}')"><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div><div class="td-guest-email">${b.guestEmail||''}</div></td><td>${getRoomName(b.room)}</td><td>${shortDate(b.checkin)}</td><td>${shortDate(b.checkout)}</td><td><span class="nights-label">${n} ${n===1?t('lbl.night'):t('lbl.nights')}</span></td><td class="td-bold">${idr(calcTotal(b))}</td><td>${quotaStatusCell(b)}</td></tr>`;
  });
}
$('bookings-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#bookings-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderBookings(e.target.dataset.filter); });

function renderInvoices(filter) {
  _currentInvoiceFilter = filter || 'all';
  const tb = $('invoices-tbody'); if (!tb) return;
  const rows = app.bookings
    .filter(b => !_currentSearch || (b.guestName||'').toLowerCase().includes(_currentSearch) || (b.id||'').toLowerCase().includes(_currentSearch))
    .filter(b => filter === 'all'
      || (filter === 'invoice' && b.type === 'invoice')
      || (filter === 'quotation' && b.type === 'quotation'));
  tb.innerHTML = '';
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-light)">No documents found.</td></tr>`; return; }
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    const es = effStatus(b);
    tb.innerHTML += `<tr onclick="openIPM('${b.id}')"><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div></td><td>${shortDate(b.checkin)} → ${shortDate(b.checkout)}</td><td><span class="nights-label">${n} ${n===1?t('lbl.night'):t('lbl.nights')}</span></td><td class="td-bold">${idr(calcTotal(b))}</td><td>${typeBadge(b.type)}</td><td>${quotaStatusCell(b)}</td></tr>`;
  });
}
$('invoices-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#invoices-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderInvoices(e.target.dataset.filter); });

// ── Live countdown ticker (runs every second) ─────────────────────
setInterval(() => {
  let needsReload = false;
  document.querySelectorAll('.quota-cd[data-expiry]').forEach(el => {
    const rem = Number(el.dataset.expiry) - Date.now();
    if (rem <= 0) { el.className = 'quota-cd quota-cd-exp'; el.removeAttribute('data-expiry'); el.textContent = 'Expired'; needsReload = true; return; }
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    const urgent = rem < 30 * 60 * 1000;
    const warn = !urgent && rem < 3 * 3600000;
    el.className = `quota-cd${urgent ? ' quota-cd-urgent' : warn ? ' quota-cd-warn' : ''}`;
    el.textContent = `⏱ ${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  });
  if (needsReload) {
    loadData().then(() => { renderBookings(_currentBookingFilter); renderInvoices(_currentInvoiceFilter); });
  }
}, 1000);

function renderReports(filter) {
  const confirmed = app.bookings.filter(b => b.status === 'confirmed');
  const awaiting = app.bookings.filter(b => b.status === 'awaiting' || (b.status === 'quotation' && effStatus(b) !== 'expired'));
  const quotations = app.bookings.filter(b => b.type === 'quotation');
  const cancelled = app.bookings.filter(b => b.status === 'cancelled' || effStatus(b) === 'expired');
  const bRev = app.bookings.filter(b => b.type === 'invoice' && b.status !== 'cancelled').reduce((s, b) => s + calcTotal(b), 0);
  const qVal = quotations.reduce((s, b) => s + calcTotal(b), 0);
  $('reports-stat-cards').innerHTML = `<div class="stat-card"><div class="stat-card-label">${t('rep.rev')}</div><div class="stat-card-value">${idr(bRev)}</div><div class="stat-card-sub green">${t('rep.from_bookings')}</div></div><div class="stat-card"><div class="stat-card-label">${t('rep.confirmed')}</div><div class="stat-card-value">${confirmed.length}</div><div class="stat-card-sub">${t('rep.bookings')}</div></div><div class="stat-card"><div class="stat-card-label">${t('rep.awaiting')}</div><div class="stat-card-value">${awaiting.length}</div><div class="stat-card-sub">${t('rep.need_follow')}</div></div><div class="stat-card"><div class="stat-card-label">${t('rep.quotations')}</div><div class="stat-card-value">${quotations.length}</div><div class="stat-card-sub">${cancelled.length} ${t('rep.cancelled_exp')}</div></div>`;
  const tb = $('reports-tbody'); if (!tb) return;
  const rows = app.bookings
    .filter(b => !_currentSearch || (b.guestName||'').toLowerCase().includes(_currentSearch) || (b.id||'').toLowerCase().includes(_currentSearch))
    .filter(b => filter === 'all' || (filter === 'booking' && b.type === 'invoice') || (filter === 'quotation' && b.type === 'quotation'));
  tb.innerHTML = '';
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    tb.innerHTML += `<tr onclick="openIPM('${b.id}')"><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div><div class="td-guest-email">${b.guestEmail||''}</div></td><td>${typeBadge(b.type)}</td><td>${getRoomName(b.room)}</td><td>${shortDate(b.checkin)}</td><td>${shortDate(b.checkout)}</td><td><span class="nights-label">${n} ${n===1?t('lbl.night'):t('lbl.nights')}</span></td><td>${idr(b.rate)}</td><td class="td-bold">${idr(calcTotal(b))}</td><td>${quotaStatusCell(b)}</td></tr>`;
  });
  $('reports-totals').innerHTML = `<span>${t('rep.quotations')} value: <strong>${idr(qVal)}</strong></span><span>${t('rep.bookings')} revenue: <strong>${idr(bRev)}</strong></span><span class="grand">Grand Total: ${idr(qVal + bRev)}</span>`;
}
$('reports-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#reports-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderReports(e.target.dataset.filter); });

// ── Inventory ─────────────────────────────────────────────────────
function renderInventory() {
  const list = $('rooms-list'); if (!list) return; list.innerHTML = '';
  app.rooms.forEach(r => {
    list.innerHTML += `<div class="room-card"><div class="room-card-info"><h3>${r.name}</h3><p>${r.location} · ${t('inv.max')} ${r.capacity} ${t('inv.guests')} &middot; ${idr(r.rate)}/${t('inv.night')}</p><p>${r.desc||''}</p></div><div class="room-card-actions"><button class="btn btn-outline btn-sm" onclick="openEditRoom('${r.id}')">${t('inv.edit')}</button><button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')">${t('inv.delete')}</button></div></div>`;
  });
}
window.openEditRoom = id => {
  const r = app.rooms.find(x => x.id === id); if (!r) return;
  $('room-modal-title').textContent = t('inv.edit_room'); $('room-edit-id').value = id;
  $('room-name').value = r.name; $('room-location').value = r.location; $('room-capacity').value = r.capacity; $('room-rate').value = r.rate; $('room-desc').value = r.desc||'';
  $('room-modal').classList.add('active');
};
window.deleteRoom = async id => {
  if (!confirm('Delete this room?')) return;
  try { await api.del(`/rooms/${id}`); showToast('Room deleted.'); await loadData(); renderInventory(); }
  catch (e) { showToast('Delete failed: ' + e.message); }
};
$('btn-add-room')?.addEventListener('click', () => { $('room-modal-title').textContent = t('inv.add_room'); $('room-form').reset(); $('room-edit-id').value = ''; $('room-modal').classList.add('active'); });
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
  renderPromos();
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
function populatePromoSelect(roomId) {
  const sel = $('form-promo'); if (!sel) return;
  const applicable = app.promos.filter(p => {
    const st = promoStatus(p);
    return (st === 'ongoing' || st === 'scheduled') && (p.roomId === 'all' || p.roomId === roomId);
  });
  sel.innerHTML = '<option value="">— No Promo —</option>';
  applicable.forEach(p => {
    const disc = p.type === 'percentage' ? `-${p.value}%` : `-${idr(p.value)}`;
    const tag = promoStatus(p) === 'scheduled' ? ' ⏰ Scheduled' : '';
    sel.innerHTML += `<option value="${p.id}">${p.name} (${disc})${tag}</option>`;
  });
  const grp = $('promo-select-group');
  if (grp) grp.style.display = applicable.length > 0 ? '' : 'none';
}
function calcFormSummary() {
  const ci = $('form-checkin').value, co = $('form-checkout').value;
  const rate = +$('form-price').value||0, cleaning = +$('form-cleaning').value||0, deposit = +$('form-deposit').value||0, taxPct = +$('form-tax').value||0, addFee = +$('form-additional').value||0;
  const n = (ci && co) ? nightsCount(ci, co) : 1;
  const acc = n * rate, taxAmt = Math.round((acc + cleaning + addFee) * taxPct / 100);
  const promoId = $('form-promo')?.value;
  const promo = promoId ? app.promos.find(p => p.id === promoId) : null;
  const discAmt = calcPromoDiscount(promo, acc);
  const total = acc + cleaning + deposit + taxAmt + addFee - discAmt;
  $('fs-rate').textContent = idr(rate); $('fs-nights-label').textContent = n + ' night' + (n>1?'s':''); $('fs-nights-count').textContent = n;
  $('fs-accommodation').textContent = idr(acc); $('fs-cleaning').textContent = cleaning>0?idr(cleaning):'—';
  if($('fs-additional')) $('fs-additional').textContent = addFee>0?idr(addFee):'—';
  $('fs-deposit').textContent = deposit>0?idr(deposit):'—'; $('fs-tax').textContent = taxPct>0?idr(taxAmt):'—';
  const promoRow = $('fs-promo-row'); if (promoRow) promoRow.style.display = discAmt > 0 ? '' : 'none';
  const promoEl = $('fs-promo'); if (promoEl) promoEl.textContent = discAmt > 0 ? '-' + idr(discAmt) : '—';
  const promoLbl = $('fs-promo-label'); if (promoLbl && promo) promoLbl.textContent = 'Promo: ' + promo.name;
  $('fs-total').textContent = idr(total);
}
function openForm(type, dateStr, prefillId) {
  populateRoomSelect();
  if (prefillId) {
    const b = app.bookings.find(x => x.id === prefillId); if (!b) return;
    $('form-modal-title').textContent = 'Edit ' + b.id;
    $('form-name').value = b.guestName||''; $('form-email').value = b.guestEmail||''; $('form-phone').value = b.phone||''; $('form-guests').value = b.numGuests||1; $('form-address').value = b.address||'';
    $('form-room').value = b.room; $('form-checkin').value = b.checkin; $('form-checkout').value = b.checkout; $('form-checkin-time').value = b.checkinTime||'14:00'; $('form-checkout-time').value = b.checkoutTime||'12:00';
    $('form-price').value = b.rate; $('form-cleaning').value = b.cleaningFee||0; $('form-additional').value = b.additionalFee||0; $('form-deposit').value = b.deposit||0; $('form-tax').value = b.tax||0; $('form-notes').value = b.notes||''; $('booking-form').dataset.editId = prefillId;
    populatePromoSelect(b.room); if ($('form-promo')) $('form-promo').value = b.promoId || '';
    if ($('form-source')) $('form-source').value = b.source || '';
  } else {
    $('form-modal-title').textContent = type==='booking'?'New Booking':'New Quotation';
    $('booking-form').reset(); $('booking-form').dataset.editId = '';
    $('form-checkin').value = dateStr||fmt(today); $('form-checkout').value = fmt(addD(new Date($('form-checkin').value), 1));
    $('form-price').value = getRoomRate($('form-room').value||app.rooms[0]?.id||'r1'); $('form-guests').value=1; $('form-cleaning').value=0; $('form-deposit').value=0; $('form-tax').value=0; $('form-checkin-time').value='14:00'; $('form-checkout-time').value='12:00';
    populatePromoSelect($('form-room').value||app.rooms[0]?.id||'');
  }
  currentFormAction = type; calcFormSummary(); $('form-modal').classList.add('active');
}
['form-checkin','form-checkout','form-price','form-cleaning','form-deposit','form-tax','form-additional'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', calcFormSummary); });
$('form-promo')?.addEventListener('change', calcFormSummary);
$('form-room')?.addEventListener('change', () => { $('form-price').value = getRoomRate($('form-room').value); populatePromoSelect($('form-room').value); calcFormSummary(); });
$('btn-create-booking-form')?.addEventListener('click', () => { lastAction = 'booking'; });
$('btn-create-quotation-form')?.addEventListener('click', () => { lastAction = 'quotation'; });
$('booking-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const ci = $('form-checkin').value, co = $('form-checkout').value;
  if (new Date(co) <= new Date(ci)) { showToast('Check-out must be after check-in.'); return; }
  const editId = $('booking-form').dataset.editId; const isBooking = lastAction === 'booking';
  const data = { type:isBooking?'invoice':'quotation', guestName:$('form-name').value, guestEmail:$('form-email').value, phone:$('form-phone').value, address:$('form-address').value, numGuests:+$('form-guests').value||1, room:$('form-room').value, checkin:ci, checkout:co, checkinTime:$('form-checkin-time').value||'14:00', checkoutTime:$('form-checkout-time').value||'12:00', rate:+$('form-price').value||310000, cleaningFee:+$('form-cleaning').value||0, additionalFee:+$('form-additional').value||0, deposit:+$('form-deposit').value||0, tax:+$('form-tax').value||0, notes:$('form-notes').value, status:isBooking?'awaiting':'quotation', promoId:$('form-promo')?.value||null, source:$('form-source')?.value||'' };
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
  const n = nightsCount(b.checkin, b.checkout);
  const acc = n * b.rate, taxAmt = Math.round((acc + b.cleaningFee + (b.additionalFee||0)) * (b.tax/100));
  const promo = b.promoId ? app.promos.find(p => p.id === b.promoId) : null;
  const discountAmt = calcPromoDiscount(promo, acc);
  const grandTotal = acc + b.cleaningFee + (b.additionalFee||0) + b.deposit + taxAmt - discountAmt;
  $('ipm-brand').textContent = app.settings.brand||'Terratjo Room'; $('ipm-brand-addr').textContent = app.settings.invAddress||'';
  const isExpiredQ = isExpired(b);
  const docLabel = b.status==='cancelled' ? 'CANCELLED' : (isExpiredQ ? 'EXPIRED QUOTATION' : (b.type==='quotation' ? 'QUOTATION' : 'INVOICE'));
  const docEl = $('ipm-doc-type'); docEl.textContent = docLabel;
  docEl.style.color = b.status==='cancelled' ? '#b91c1c' : (isExpiredQ ? '#6b7280' : 'var(--primary)');
  $('ipm-doc-id').textContent = b.id;
  const jkt = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const docDateStr = shortDate(`${jkt.getFullYear()}-${String(jkt.getMonth()+1).padStart(2,'0')}-${String(jkt.getDate()).padStart(2,'0')}`);
  $('ipm-doc-date').textContent = 'Date: ' + docDateStr;
  const stamp = $('ipm-cancelled-stamp'); b.status==='cancelled'?stamp.classList.remove('hidden'):stamp.classList.add('hidden');
  $('ipm-f-name').value = b.guestName||''; $('ipm-f-addr').value = b.address||''; $('ipm-meta-contact').textContent = (b.guestEmail||'') + (b.phone?' · '+b.phone:'');
  $('ipm-meta-room').textContent = (b.numGuests||1)+' guest'+(b.numGuests>1?'s':'')+' · Room: '+getRoomName(b.room);
  $('ipm-ci-date').value = b.checkin; $('ipm-ci-time').value = b.checkinTime||'14:00'; $('ipm-co-date').value = b.checkout; $('ipm-co-time').value = b.checkoutTime||'12:00'; $('ipm-duration').textContent = n+' Night'+(n>1?'s':'');
  $('ipm-t-nights').textContent = n+' night'+(n>1?'s':''); $('ipm-t-rate').value = b.rate; $('ipm-t-room-amt').textContent = idr(acc);
  if($('ipm-t-nights').previousElementSibling) $('ipm-t-nights').previousElementSibling.textContent = getRoomName(b.room);
  $('ipm-t-cleaning').textContent = idr(b.cleaningFee); $('ipm-row-cleaning').classList.toggle('hidden', b.cleaningFee<=0);
  $('ipm-t-additional').textContent = idr(b.additionalFee||0); $('ipm-row-additional').classList.toggle('hidden', (b.additionalFee||0)<=0);
  $('ipm-t-deposit').textContent = idr(b.deposit); $('ipm-row-deposit').classList.toggle('hidden', b.deposit<=0);
  $('ipm-t-tax').textContent = idr(taxAmt); $('ipm-row-tax').classList.toggle('hidden', b.tax<=0);
  // Promo row
  if ($('ipm-row-promo')) {
    $('ipm-row-promo').classList.toggle('hidden', discountAmt <= 0);
    if (discountAmt > 0 && promo) { $('ipm-t-promo-name').textContent = 'Promo: ' + promo.name; $('ipm-t-promo').textContent = '-' + idr(discountAmt); }
  }
  $('ipm-t-grand').textContent = idr(grandTotal);

  // Payment Method Display
  if (b.status === 'confirmed' && b.paymentMethod) {
    $('ipm-bank-name').innerHTML = `<strong>Method Used:</strong> ${b.paymentMethod}`;
    $('ipm-acc-name').textContent = '';
    $('ipm-acc-no').textContent = '';
  } else {
    $('ipm-bank-name').textContent = app.settings.bankName || 'Bank Central Asia (BCA)';
    $('ipm-acc-name').textContent = 'Account Name: ' + (app.settings.accName || 'Thomas Vialdo Resky Lamandau');
    $('ipm-acc-no').textContent = 'Account No: ' + (app.settings.accNo || '060-132-7499');
  }
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
  const rate = +$('ipm-t-rate').value||0; const acc = n*rate; const taxAmt = Math.round((acc+b.cleaningFee+(b.additionalFee||0))*(b.tax/100));
  const promo = b.promoId ? app.promos.find(p => p.id === b.promoId) : null;
  const disc = calcPromoDiscount(promo, acc);
  $('ipm-t-room-amt').textContent = idr(acc); $('ipm-t-grand').textContent = idr(acc+b.cleaningFee+(b.additionalFee||0)+b.deposit+taxAmt-disc);
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
  
  $('payment-booking-id').value = b.id;
  $('payment-method').value = 'Transfer BCA';
  $('payment-proof-file').value = '';
  const p = $('payment-drop-area').querySelector('p');
  p.innerHTML = `Drag & drop a file or <span>browse</span>`;
  $('payment-modal').classList.add('active');

  
});

// ── Data Load & Init ──────────────────────────────────────────────
async function loadData() {
  const [s, r, b, pr] = await Promise.all([api.get('/settings'), api.get('/rooms'), api.get('/bookings'), api.get('/promos')]);
  Object.assign(app.settings, s); app.rooms = r; app.bookings = b; app.promos = pr;
}
async function initApp() {
  if (!token) { showLogin(); return; }
  try {
    await loadData();
    lucide.createIcons(); populateRoomSelect(); updateTopBar(); navigate(prevPage);
    applyLogo(app.settings.logo || '');
    setLanguage(currentLang);
    initSSE();
  } catch (e) { console.error('Init failed:', e); showToast('Failed to load data. Check backend.'); logout(); }
}
function updateTopBar() {
  if ($('tb-brand')) $('tb-brand').textContent = (app.settings.brand||'Terratjo') + ' ' + (app.settings.tagline||'Booking Portal');
  if ($('tb-loc')) $('tb-loc').textContent = app.settings.location||'';
  if ($('sidebar-brand-name')) $('sidebar-brand-name').textContent = app.settings.brand||'Terratjo Room';
  if ($('sidebar-tagline')) $('sidebar-tagline').textContent = app.settings.tagline||'Booking Portal';
}

// ── Logo Upload ───────────────────────────────────────────────────
function applyLogo(dataUrl) {
  const src = dataUrl || '/logo.png';
  const imgTag = `<img src="${src}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;">`;

  ['sidebar-logo-box','settings-logo-circle','sip-logo-box','ipm-logo-circle'].forEach(id => {
    const el = $(id); if (el) el.innerHTML = imgTag;
  });
  // Update login modal logo and refresh localStorage cache
  const loginLogoImg = document.getElementById('login-logo-img');
  if (loginLogoImg) { loginLogoImg.src = src; loginLogoImg.style.opacity = '1'; }
  if (dataUrl) localStorage.setItem('terratjo_logo_cache', dataUrl);
  else localStorage.removeItem('terratjo_logo_cache');

  const removeBtn = $('btn-remove-logo');
  if (removeBtn) removeBtn.style.display = dataUrl ? 'inline-flex' : 'none';

  const hintTitle = document.querySelector('.logo-upload-hint-title');
  if (hintTitle) hintTitle.textContent = dataUrl ? 'Click to change logo' : 'Click to upload logo';
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
  const promo = b.promoId ? (app.promos||[]).find(p => p.id === b.promoId) : null;
  const discountAmt = calcPromoDiscount(promo, roomAmt);
  const grand = roomAmt + (b.cleaningFee || 0) + (b.deposit || 0) + taxAmt - discountAmt;
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
    + '<div><div class="dt">'+type+'</div><div class="dm" style="font-weight:700; color:#1a1a2e; margin-bottom: 2px;">'+b.id+'</div><div class="dm">Date: '+todayStr+'</div></div></div>'
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
    + '<tr><td>'+roomName+'</td><td>'+nights+' night(s)</td><td>'+fmtMoney(b.rate)+'</td><td>'+fmtMoney(roomAmt)+'</td></tr>'
    + ((b.cleaningFee||0)>0 ? '<tr><td>Cleaning Fee</td><td>1</td><td>-</td><td>'+fmtMoney(b.cleaningFee)+'</td></tr>' : '')
    + ((b.additionalFee||0)>0 ? '<tr><td>Additional Fee</td><td>1</td><td>-</td><td>'+fmtMoney(b.additionalFee)+'</td></tr>' : '')
    + ((b.deposit||0)>0 ? '<tr><td>Deposit</td><td>1</td><td>-</td><td>'+fmtMoney(b.deposit)+'</td></tr>' : '')
    + ((b.tax||0)>0 ? '<tr><td>Tax ('+b.tax+'%)</td><td>-</td><td>-</td><td>'+fmtMoney(taxAmt)+'</td></tr>' : '')
    + (discountAmt > 0 ? `<tr style="color:#16a34a"><td>Promo: ${promo.name}</td><td>-</td><td>-</td><td>-${fmtMoney(discountAmt)}</td></tr>` : '')
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

// ── Promo CRUD ────────────────────────────────────────────────────
function renderPromos() {
  const list = $('promos-list'); if (!list) return;
  if (!app.promos.length) {
    list.innerHTML = '<div class="promo-empty">No promos yet. Click "Add Promo" to create one.</div>'; return;
  }
  const badge = s => {
    const cfg = { ongoing:{cls:'promo-badge-ongoing',lbl:'🟢 '+t('promo.ongoing')}, scheduled:{cls:'promo-badge-scheduled',lbl:'🔵 '+t('promo.scheduled')}, inactive:{cls:'promo-badge-inactive',lbl:'⚫ '+t('promo.inactive')} }[s] || {cls:'',lbl:s};
    return `<span class="promo-badge ${cfg.cls}">${cfg.lbl}</span>`;
  };
  list.innerHTML = `<div class="promo-table-wrap"><table class="promo-table">
    <thead><tr><th>${t('th.desc')}</th><th>${t('th.room')}</th><th>${t('th.discount')}</th><th>${t('th.period')}</th><th>${t('th.status')}</th><th></th></tr></thead>
    <tbody>${app.promos.map(p => {
      const st = promoStatus(p);
      const disc = p.type === 'percentage' ? `-${p.value}%` : `-${idr(p.value)}`;
      const room = p.roomId === 'all' ? t('promo.all_rooms') : getRoomName(p.roomId);
      const period = p.startDate && p.endDate ? `${shortDate(p.startDate)} → ${shortDate(p.endDate)}` : '—';
      return `<tr>
        <td><strong>${p.name}</strong></td>
        <td>${room}</td>
        <td style="color:#16a34a;font-weight:700;">${disc}</td>
        <td style="font-size:12px;">${period}</td>
        <td>${badge(st)}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-outline btn-sm" onclick="openEditPromo('${p.id}')">${t('inv.edit')}</button>
          <button class="btn btn-danger btn-sm" onclick="deletePromo('${p.id}')">${t('inv.delete')}</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

window.openEditPromo = function(id) {
  const p = app.promos.find(x => x.id === id); if (!p) return;
  $('promo-modal-title').textContent = 'Edit Promo'; $('promo-edit-id').value = id;
  $('promo-name').value = p.name; $('promo-type').value = p.type;
  $('promo-value').value = p.value;
  $('promo-start').value = p.startDate||''; $('promo-end').value = p.endDate||'';
  populatePromoRoomSelect(); $('promo-room').value = p.roomId || 'all';
  document.querySelectorAll('.promo-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === p.type));
  $('promo-value-label').textContent = p.type === 'percentage' ? t('promo.val_perc') : t('promo.val_fixed');
  updatePromoStatusPreview();
  $('promo-modal').classList.add('active');
};
window.deletePromo = async function(id) {
  if (!confirm('Delete this promo?')) return;
  try { await api.del(`/promos/${id}`); showToast('Promo deleted.'); await loadData(); renderPromos(); populatePromoSelect($('form-room')?.value||''); }
  catch (e) { showToast('Delete failed: ' + e.message); }
};

function populatePromoRoomSelect() {
  const sel = $('promo-room'); if (!sel) return;
  sel.innerHTML = '<option value="all">All Rooms</option>';
  app.rooms.forEach(r => { sel.innerHTML += `<option value="${r.id}">${r.name}</option>`; });
}
function updatePromoStatusPreview() {
  const start = $('promo-start')?.value, end = $('promo-end')?.value;
  const el = $('promo-status-preview'); if (!el) return;
  if (!start || !end) { el.style.display = 'none'; return; }
  const st = promoStatus({ startDate: start, endDate: end });
  const cfg = { ongoing:{bg:'#dcfce7',color:'#166534',text:'🟢 Status: Ongoing'}, scheduled:{bg:'#dbeafe',color:'#1e40af',text:'🔵 Status: Scheduled'}, inactive:{bg:'#f3f4f6',color:'#374151',text:'⚫ Status: Inactive'} }[st];
  el.style.display = ''; el.style.background = cfg.bg; el.style.color = cfg.color; el.textContent = cfg.text;
}

$('btn-add-promo')?.addEventListener('click', () => {
  $('promo-modal-title').textContent = 'Add Promo'; $('promo-form').reset(); $('promo-edit-id').value = '';
  $('promo-type').value = 'percentage'; $('promo-value-label').textContent = t('promo.val_perc');
  document.querySelectorAll('.promo-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'percentage'));
  populatePromoRoomSelect(); $('promo-status-preview').style.display = 'none';
  $('promo-modal').classList.add('active');
});
document.querySelectorAll('.promo-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    $('promo-type').value = type;
    document.querySelectorAll('.promo-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
    $('promo-value-label').textContent = type === 'percentage' ? t('promo.val_perc') : t('promo.val_fixed');
  });
});
['promo-start','promo-end'].forEach(id => $(id)?.addEventListener('change', updatePromoStatusPreview));
$('promo-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = { name:$('promo-name').value, type:$('promo-type').value, value:+$('promo-value').value, roomId:$('promo-room').value, startDate:$('promo-start').value, endDate:$('promo-end').value };
  const eid = $('promo-edit-id').value;
  try {
    if (eid) { await api.put(`/promos/${eid}`, data); showToast('Promo updated! ✅'); }
    else { await api.post('/promos', data); showToast('Promo created! ✅'); }
    $('promo-modal').classList.remove('active'); await loadData(); renderPromos(); populatePromoSelect($('form-room')?.value||'');
  } catch (e) { showToast('Save failed: ' + e.message); }
});
['btn-close-promo-modal','btn-cancel-promo'].forEach(id => $(id)?.addEventListener('click', () => $('promo-modal').classList.remove('active')));
window.addEventListener('error', function(e) {
  alert('Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
});


$('btn-close-payment-modal')?.addEventListener('click', () => $('payment-modal').classList.remove('active'));
$('btn-cancel-payment')?.addEventListener('click', () => $('payment-modal').classList.remove('active'));

$('btn-confirm-payment')?.addEventListener('click', async () => {
  const bId = $('payment-booking-id').value;
  const b = app.bookings.find(x => x.id === bId); if (!b) return;
  const paymentMethod = $('payment-method').value;
  const fileInput = $('payment-proof-file');
  let paymentProofBase64 = null;

  const confirmBtn = $('btn-confirm-payment');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  try {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      paymentProofBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
      });
    }

    await api.put(`/bookings/${b.id}`, { ...b, type:'invoice', status:'confirmed', paymentMethod, paymentProofBase64 });
    showToast('Converted to Invoice ✓');
    $('payment-modal').classList.remove('active');
    await loadData(); openIPM(b.id); refreshCurrentPage();
  } catch(e) { 
    showToast('Conversion failed: ' + e.message); 
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm as Paid';
  }
});


$('payment-proof-file')?.addEventListener('change', function() {
  const p = $('payment-drop-area').querySelector('p');
  if (this.files && this.files.length > 0) {
      p.innerHTML = `Selected: <b>${this.files[0].name}</b>`;
  } else {
      p.innerHTML = `Drag & drop a file or <span>browse</span>`;
  }
});
