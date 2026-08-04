// ── Auth & State ────────────────────────────────────────────────
const API = '/api';
const app = { settings: {}, rooms: [], bookings: [], promos: [], guests: [] };
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
    'st.confirmed':'Confirmed', 'st.awaiting':'Awaiting Payment', 'st.quotation':'Quotation', 'st.cancelled':'Cancelled', 'st.expired':'Expired', 'st.invoice':'Invoice', 'st.completed':'Completed',
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
    'st.confirmed':'Terkonfirmasi', 'st.awaiting':'Menunggu Pembayaran', 'st.quotation':'Penawaran', 'st.cancelled':'Dibatalkan', 'st.expired':'Kedaluwarsa', 'st.invoice':'Faktur', 'st.completed':'Selesai',
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
  // For session-protected routes, 401/403 means session expired → logout
  // For /auth routes (login), 401 just means wrong credentials → throw so catch can show message
  if ((res.status === 401 || res.status === 403) && !path.startsWith('/auth')) { logout(); return; }
  if (!res.ok) {
    let errMsg = 'Request failed';
    try { const j = await res.json(); errMsg = j.error || j.message || errMsg; } catch { errMsg = await res.text().catch(() => errMsg); }
    throw new Error(errMsg);
  }
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
// getRoomRate: if checkin/checkout provided, calculates weighted avg across weekday/weekend nights
// Weekdays = Sun(0)–Thu(4), Weekend = Fri(5)–Sat(6)
function getRoomRate(id, checkin, checkout) {
  const room = app.rooms.find(r => r.id === id);
  if (!room) return 310000;
  const isHigh = room.is_high_season ? true : false;
  const wdRate = isHigh ? (room.rate_high || room.rate || 0) : (room.rate || 0);
  const weRate = isHigh ? (room.rate_high_weekend || room.rate_weekend || wdRate) : (room.rate_weekend || wdRate);
  if (!checkin || !checkout) return wdRate;
  let wdNights = 0, weNights = 0;
  const d = new Date(checkin);
  const end = new Date(checkout);
  while (d < end) {
    const day = d.getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
    if (day === 5 || day === 6) weNights++; else wdNights++;
    d.setDate(d.getDate() + 1);
  }
  const totalNights = wdNights + weNights;
  if (totalNights === 0) return wdRate;
  return Math.round((wdNights * wdRate + weNights * weRate) / totalNights);
}
const calcTotal = b => { const n = nightsCount(b.checkin, b.checkout); const acc = n * b.rate; const tax = Math.round((acc + b.cleaningFee + (b.additionalFee||0)) * (b.tax / 100)); const promo = b.promoId ? app.promos.find(p => p.id === b.promoId) : null; const disc = promo ? (promo.type === 'percentage' ? Math.round(acc * promo.value / 100) : Math.min(Number(promo.value), acc)) : 0; return acc + b.cleaningFee + (b.additionalFee||0) + b.deposit + tax - disc; };
const todayStr = _todayJkt; // Already "YYYY-MM-DD" in Jakarta timezone — no toISOString() UTC drift
// isExpired: true if server already set status='expired', OR quotation check-in date has passed
const isExpired = b => b.status === 'expired' || (b.status === 'quotation' && b.checkin < todayStr);
const effStatus = b => isExpired(b) ? 'expired' : b.status;
// Promo helpers
const promoStatus = p => { const today = todayStr; if (!p.startDate || !p.endDate) return 'inactive'; if (today < p.startDate) return 'scheduled'; if (today > p.endDate) return 'inactive'; return 'ongoing'; };
const calcPromoDiscount = (promo, acc) => !promo ? 0 : promo.type === 'percentage' ? Math.round(acc * promo.value / 100) : Math.min(Number(promo.value), acc);

function showToast(msg) { const toastEl = $('toast'); toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 2800); }
function statusBadge(s) { const m = { confirmed:'badge-confirmed', awaiting:'badge-awaiting', quotation:'badge-quotation', cancelled:'badge-cancelled', expired:'badge-expired', completed:'badge-completed' }; const l = { confirmed:t('st.confirmed'), awaiting:t('st.awaiting'), quotation:t('st.quotation'), cancelled:t('st.cancelled'), expired:t('st.expired'), completed:t('st.completed') }; return `<span class="badge ${m[s]||''}">${l[s]||s}</span>`; }
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
      if (!res || !res.token) { showToast('Wrong username or password. Please try again.'); return; }
      token = res.token;
      localStorage.setItem('terratjo_token', token);
      $('login-overlay').classList.remove('active');
      initApp();
    } catch (e) {
      const msg = (e.message||'').toLowerCase().includes('invalid credentials') || (e.message||'').toLowerCase().includes('wrong')
        ? 'Wrong username or password. Please try again.'
        : 'Login failed. Please check your connection and try again.';
      showToast(msg);
    }
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
    _logoImg.style.opacity = '1';
  } else if (_logoImg) {
    _logoImg.style.opacity = '0'; // hide wrong static logo until correct one loads
  }
  fetch('/api/logo').then(r => r.json()).then(d => {
    if (d.logo) {
      localStorage.setItem('terratjo_logo_cache', d.logo);
      if (_logoImg) { _logoImg.src = d.logo; _logoImg.style.opacity = '1'; }
    } else if (_logoImg) { 
      _logoImg.src = '/logo.png'; 
      _logoImg.style.opacity = '1'; 
    }
  }).catch(() => { if (_logoImg) { _logoImg.src = '/logo.png'; _logoImg.style.opacity = '1'; } });

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
  if (pageId === 'guests') renderGuests($('guest-search')?.value || '');
  if (pageId === 'settings') renderSettings();
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
  const p = $('page-' + pageId); if (p) p.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`[data-page="${pageId}"]`); if (el) el.classList.add('active');
  if (window.innerWidth <= 1000) closeSidebar();
  const todayPill = $('today-pill-fixed');
  if (todayPill) todayPill.style.display = pageId === 'calendar' ? 'flex' : 'none';
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
  const showDesktopDropdown = ['calendar', 'inventory', 'settings'].includes(prevPage);
  if (!_currentSearch) { dDesk.classList.add('hidden'); dMob.classList.add('hidden'); return; }
  
  // Only hide desktop dropdown if we are on a list view (which handles search itself)
  if (!showDesktopDropdown) { dDesk.classList.add('hidden'); }
  
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
  
  // Always update innerHTML
  dDesk.innerHTML = html; dMob.innerHTML = html;
  
  // Desktop dropdown visibility
  if (showDesktopDropdown) dDesk.classList.remove('hidden');
  
  // Mobile dropdown ALWAYS visible when searching (because it's in the sidebar overlay)
  dMob.classList.remove('hidden');
  
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
  if (prevPage === 'guests') renderGuests($('guest-search')?.value || '');
  if (prevPage === 'settings') renderSettings();
}
document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); }));

// ── Calendar ─────────────────────────────────────────────────────
// ── Indonesian Public Holidays & Commemorative Days ────────────────
// Islamic dates are approximations based on the Hijri calendar (~10-11 day annual shift).
const ID_HOLIDAYS = {
  // ── 2025 ──────────────────────────────────────────────────────────
  '2025-01-01': "New Year's Day",
  '2025-01-27': "Prophet Muhammad's Ascension (Isra Mi'raj)",
  '2025-01-29': 'Chinese New Year 2576',
  '2025-03-29': 'Nyepi — Balinese Hindu New Year',
  '2025-03-31': 'Eid al-Fitr (Idul Fitri)',
  '2025-04-01': 'Eid al-Fitr Holiday (Day 2)',
  '2025-04-18': 'Good Friday',
  '2025-04-20': 'Easter Sunday',
  '2025-05-01': 'International Labour Day',
  '2025-05-12': 'Vesak Day (Buddha\'s Birthday)',
  '2025-05-29': 'Ascension of Jesus Christ',
  '2025-06-01': 'Pancasila Day',
  '2025-06-06': 'Eid al-Adha (Idul Adha)',
  '2025-06-26': 'Islamic New Year (Muharram)',
  '2025-08-17': 'Indonesian Independence Day',
  '2025-09-04': "Prophet Muhammad's Birthday (Maulid Nabi)",
  '2025-10-01': 'Pancasila Sacredness Day',
  '2025-10-02': 'National Batik Day',
  '2025-10-28': 'Youth Pledge Day',
  '2025-11-10': 'National Heroes Day',
  '2025-12-12': "Father's Day",
  '2025-12-22': "Mother's Day",
  '2025-12-24': 'Christmas Eve Holiday',
  '2025-12-25': 'Christmas Day',
  '2025-12-26': 'Christmas Holiday',

  // ── 2026 ──────────────────────────────────────────────────────────
  '2026-01-01': "New Year's Day",
  '2026-01-17': "Prophet Muhammad's Ascension (Isra Mi'raj)",
  '2026-02-17': 'Chinese New Year 2577',
  '2026-03-19': 'Eid al-Fitr (Idul Fitri)',
  '2026-03-20': 'Eid al-Fitr Holiday (Day 2)',
  '2026-03-21': 'Eid al-Fitr Joint Holiday',
  '2026-03-28': 'Nyepi — Balinese Hindu New Year',
  '2026-04-03': 'Good Friday',
  '2026-04-05': 'Easter Sunday',
  '2026-05-01': 'International Labour Day',
  '2026-05-14': 'Ascension of Jesus Christ',
  '2026-05-27': 'Eid al-Adha (Idul Adha)',
  '2026-05-31': 'Vesak Day (Buddha\'s Birthday)',
  '2026-06-01': 'Pancasila Day',
  '2026-06-16': 'Islamic New Year (Muharram)',
  '2026-08-17': 'Indonesian Independence Day',
  '2026-08-25': "Prophet Muhammad's Birthday (Maulid Nabi)",
  '2026-10-01': 'Pancasila Sacredness Day',
  '2026-10-02': 'National Batik Day',
  '2026-10-28': 'Youth Pledge Day',
  '2026-11-10': 'National Heroes Day',
  '2026-12-12': "Father's Day",
  '2026-12-22': "Mother's Day",
  '2026-12-24': 'Christmas Eve Holiday',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Christmas Holiday',

  // ── 2027 ──────────────────────────────────────────────────────────
  '2027-01-01': "New Year's Day",
  '2027-01-07': "Prophet Muhammad's Ascension (Isra Mi'raj)",
  '2027-02-06': 'Chinese New Year 2578',
  '2027-03-09': 'Eid al-Fitr (Idul Fitri)',
  '2027-03-10': 'Eid al-Fitr Holiday (Day 2)',
  '2027-03-11': 'Eid al-Fitr Joint Holiday',
  '2027-03-19': 'Nyepi — Balinese Hindu New Year',
  '2027-04-02': 'Good Friday',
  '2027-04-04': 'Easter Sunday',
  '2027-05-01': 'International Labour Day',
  '2027-05-13': 'Ascension of Jesus Christ',
  '2027-05-17': 'Eid al-Adha (Idul Adha)',
  '2027-05-21': 'Vesak Day (Buddha\'s Birthday)',
  '2027-06-01': 'Pancasila Day',
  '2027-06-06': 'Islamic New Year (Muharram)',
  '2027-08-15': "Prophet Muhammad's Birthday (Maulid Nabi)",
  '2027-08-17': 'Indonesian Independence Day',
  '2027-10-01': 'Pancasila Sacredness Day',
  '2027-10-02': 'National Batik Day',
  '2027-10-28': 'Youth Pledge Day',
  '2027-11-10': 'National Heroes Day',
  '2027-12-12': "Father's Day",
  '2027-12-22': "Mother's Day",
  '2027-12-24': 'Christmas Eve Holiday',
  '2027-12-25': 'Christmas Day',
  '2027-12-26': 'Christmas Holiday',

  // ── 2028 ──────────────────────────────────────────────────────────
  '2028-01-01': "New Year's Day",
  '2028-01-26': 'Chinese New Year 2579',
  '2028-02-26': 'Eid al-Fitr (Idul Fitri)',
  '2028-02-27': 'Eid al-Fitr Holiday (Day 2)',
  '2028-02-28': 'Eid al-Fitr Joint Holiday',
  '2028-03-07': 'Nyepi — Balinese Hindu New Year',
  '2028-04-14': 'Good Friday',
  '2028-04-16': 'Easter Sunday',
  '2028-05-01': 'International Labour Day',
  '2028-05-06': 'Eid al-Adha (Idul Adha)',
  '2028-05-10': 'Vesak Day (Buddha\'s Birthday)',
  '2028-05-25': 'Ascension of Jesus Christ',
  '2028-05-26': 'Islamic New Year (Muharram)',
  '2028-06-01': 'Pancasila Day',
  '2028-08-05': "Prophet Muhammad's Birthday (Maulid Nabi)",
  '2028-08-17': 'Indonesian Independence Day',
  '2028-12-16': "Prophet Muhammad's Ascension (Isra Mi'raj)",
  '2028-10-01': 'Pancasila Sacredness Day',
  '2028-10-02': 'National Batik Day',
  '2028-10-28': 'Youth Pledge Day',
  '2028-11-10': 'National Heroes Day',
  '2028-12-12': "Father's Day",
  '2028-12-22': "Mother's Day",
  '2028-12-24': 'Christmas Eve Holiday',
  '2028-12-25': 'Christmas Day',
  '2028-12-26': 'Christmas Holiday',
};

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
    const isToday = ds === todayStr;
    const isWE = [0, 6].includes(new Date(calYear, calMonth, d).getDay());
    const holiday = ID_HOLIDAYS[ds];
    // Priority: holiday > today > weekend
    let cls = holiday ? 'holiday' : isToday ? 'today' : isWE ? 'weekend' : '';
    if (isToday && holiday) cls = 'today holiday';
    let blks = '';
    app.bookings.forEach(b => {
      if (ds >= b.checkin && ds < b.checkout) {
        const lbl = ds === b.checkin ? (b.guestName||'').split(' ')[0] : '';
        blks += `<div class="booking-block booking-${effStatus(b)}" data-bid="${b.id}" onclick="openIPM('${b.id}');event.stopPropagation();">${lbl}</div>`;
      }
    });
    const holidayLabel = holiday ? `<span class="holiday-label" title="${holiday}">${holiday.split(' ').slice(0,3).join(' ')}</span>` : '';
    const isPast = ds < todayStr;
    const cellTitle = holiday ? ` title="${holiday}"` : '';
    grid.innerHTML += `<div class="day-cell ${isPast ? 'past' : ''} ${holiday ? 'holiday-cell' : ''}" data-date="${ds}"${cellTitle}><div class="day-number ${cls}">${d}</div>${holidayLabel}${blks}</div>`;
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

  // Show public holiday badge if applicable
  const holidayName = ID_HOLIDAYS[dateStr];
  const existingBadge = $('dds-holiday-badge');
  if (existingBadge) existingBadge.remove();
  if (holidayName) {
    const badge = document.createElement('div');
    badge.id = 'dds-holiday-badge';
    badge.style.cssText = 'background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:600;padding:4px 10px;border-radius:8px;margin-top:4px;display:inline-block;';
    badge.textContent = '🇮🇩 ' + holidayName;
    dateEl.insertAdjacentElement('afterend', badge);
  }

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
$('btn-goto-today')?.addEventListener('click', () => {
  const now = new Date(_todayJkt + 'T00:00:00');
  calMonth = now.getMonth();
  calYear = now.getFullYear();
  renderCalendar();
});

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
    tb.innerHTML += `<tr data-bid="${b.id}" onclick="handleRowClick('${b.id}')"><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div><div class="td-guest-email">${b.guestEmail||''}</div></td><td>${getRoomName(b.room)}</td><td>${shortDate(b.checkin)}</td><td>${shortDate(b.checkout)}</td><td><span class="nights-label">${n} ${n===1?t('lbl.night'):t('lbl.nights')}</span></td><td class="td-bold">${idr(calcTotal(b))}</td><td>${quotaStatusCell(b)}</td></tr>`;
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
    tb.innerHTML += `<tr data-bid="${b.id}" onclick="handleRowClick('${b.id}')"><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div></td><td>${shortDate(b.checkin)} → ${shortDate(b.checkout)}</td><td><span class="nights-label">${n} ${n===1?t('lbl.night'):t('lbl.nights')}</span></td><td class="td-bold">${idr(calcTotal(b))}</td><td>${typeBadge(b.type)}</td><td>${quotaStatusCell(b)}</td></tr>`;
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
  // Revenue = confirmed invoices + cancelled invoices where guest paid and no refund was given
  const bRev = app.bookings.filter(b => b.type === 'invoice' && (b.status !== 'cancelled' || b.noRefund)).reduce((s, b) => s + calcTotal(b), 0);
  const qVal = quotations.reduce((s, b) => s + calcTotal(b), 0);
  $('reports-stat-cards').innerHTML = `<div class="stat-card"><div class="stat-card-label">${t('rep.rev')}</div><div class="stat-card-value">${idr(bRev)}</div><div class="stat-card-sub green">${t('rep.from_bookings')}</div></div><div class="stat-card"><div class="stat-card-label">${t('rep.confirmed')}</div><div class="stat-card-value">${confirmed.length}</div><div class="stat-card-sub">${t('rep.bookings')}</div></div><div class="stat-card"><div class="stat-card-label">${t('rep.awaiting')}</div><div class="stat-card-value">${awaiting.length}</div><div class="stat-card-sub">${t('rep.need_follow')}</div></div><div class="stat-card"><div class="stat-card-label">${t('rep.quotations')}</div><div class="stat-card-value">${quotations.length}</div><div class="stat-card-sub">${cancelled.length} ${t('rep.cancelled_exp')}</div></div>`;
  const tb = $('reports-tbody'); if (!tb) return;
  const rows = app.bookings
    .filter(b => !_currentSearch || (b.guestName||'').toLowerCase().includes(_currentSearch) || (b.id||'').toLowerCase().includes(_currentSearch))
    .filter(b => filter === 'all' || (filter === 'booking' && b.type === 'invoice') || (filter === 'quotation' && b.type === 'quotation'));
  tb.innerHTML = '';
  rows.forEach(b => {
    const n = nightsCount(b.checkin, b.checkout);
    tb.innerHTML += `<tr data-bid="${b.id}" onclick="handleRowClick('${b.id}')"><td><span class="td-ref">${b.id}</span></td><td><div class="td-guest-name">${b.guestName}</div><div class="td-guest-email">${b.guestEmail||''}</div></td><td>${typeBadge(b.type)}</td><td>${getRoomName(b.room)}</td><td>${shortDate(b.checkin)}</td><td>${shortDate(b.checkout)}</td><td><span class="nights-label">${n} ${n===1?t('lbl.night'):t('lbl.nights')}</span></td><td>${idr(b.rate)}</td><td class="td-bold">${idr(calcTotal(b))}</td><td>${quotaStatusCell(b)}</td></tr>`;
  });
  $('reports-totals').innerHTML = `<span>${t('rep.quotations')} value: <strong>${idr(qVal)}</strong></span><span>${t('rep.bookings')} revenue: <strong>${idr(bRev)}</strong></span><span class="grand">Grand Total: ${idr(qVal + bRev)}</span>`;
}
$('reports-tabs')?.addEventListener('click', e => { if (!e.target.matches('.tab-btn')) return; document.querySelectorAll('#reports-tabs .tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderReports(e.target.dataset.filter); });

// ── Inventory ─────────────────────────────────────────────────────
function renderInventory() {
  const list = $('rooms-list'); if (!list) return; list.innerHTML = '';
  app.rooms.forEach(r => {
    const seasonBadge = r.is_high_season 
      ? `<span style="background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;">🔥 HIGH SEASON</span>`
      : `<span style="background:#ecfdf5;color:#065f46;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;">🌿 LOW SEASON</span>`;
    const lowWd = r.rate || 0;
    const lowWe = r.rate_weekend || lowWd;
    const hiWd = r.rate_high || lowWd;
    const hiWe = r.rate_high_weekend || lowWe;
    list.innerHTML += `<div class="room-card">
      <div class="room-card-info">
        <h3>${r.name} &nbsp; ${seasonBadge}</h3>
        <p>${r.location} · ${t('inv.max')} ${r.capacity} ${t('inv.guests')}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;">
            <div style="font-size:10px;font-weight:600;color:#64748b;letter-spacing:.5px;">LOW SEASON</div>
            <div style="font-size:12px;color:#334155;margin-top:2px;">Weekday: <strong>${idr(lowWd)}</strong> &nbsp;·&nbsp; Weekend: <strong>${idr(lowWe)}</strong></div>
          </div>
          <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:6px 12px;">
            <div style="font-size:10px;font-weight:600;color:#c53030;letter-spacing:.5px;">HIGH SEASON</div>
            <div style="font-size:12px;color:#334155;margin-top:2px;">Weekday: <strong>${idr(hiWd)}</strong> &nbsp;·&nbsp; Weekend: <strong>${idr(hiWe)}</strong></div>
          </div>
        </div>
        <p style="margin-top:6px;">${r.desc||''}</p>
      </div>
      <div class="room-card-actions"><button class="btn btn-outline btn-sm" onclick="openEditRoom('${r.id}')">${t('inv.edit')}</button><button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')">${t('inv.delete')}</button></div>
    </div>`;
  });
}
let currentRoomRates = { rate: 310000, rate_weekend: 310000, rate_high: 400000, rate_high_weekend: 400000 };

// Helper: returns true if Hi season btn is active
function isHighSeason() { return $('season-btn-hi')?.classList.contains('active'); }

// Apply season UI state
function setSeasonUI(isHigh) {
  const modal = document.querySelector('#room-modal .modal');
  const loBtn = $('season-btn-lo');
  const hiBtn = $('season-btn-hi');
  const pill  = $('room-season-toggle-wrap');
  if (isHigh) {
    hiBtn.classList.add('active', 'hi-active');
    loBtn.classList.remove('active');
    pill?.classList.add('hi-mode');
    modal?.classList.add('high-season-bg');
  } else {
    loBtn.classList.add('active');
    hiBtn.classList.remove('active', 'hi-active');
    pill?.classList.remove('hi-mode');
    modal?.classList.remove('high-season-bg');
  }
}

window.openEditRoom = id => {
  const r = app.rooms.find(x => x.id === id); if (!r) return;
  $('room-modal-title').textContent = t('inv.edit_room'); $('room-edit-id').value = id;
  $('room-name').value = r.name; $('room-location').value = r.location; $('room-capacity').value = r.capacity; $('room-desc').value = r.desc||'';
  document.querySelector('.btn-save-room').textContent = 'Save Room';
  
  currentRoomRates = {
    rate: r.rate || 0,
    rate_weekend: r.rate_weekend || 0,
    rate_high: r.rate_high || 0,
    rate_high_weekend: r.rate_high_weekend || 0
  };
  
  const isHigh = r.is_high_season ? true : false;
  setSeasonUI(isHigh);
  if (isHigh) {
    $('room-rate').value = currentRoomRates.rate_high;
    $('room-rate-weekend').value = currentRoomRates.rate_high_weekend;
  } else {
    $('room-rate').value = currentRoomRates.rate;
    $('room-rate-weekend').value = currentRoomRates.rate_weekend;
  }
  
  $('room-modal').classList.add('active');
};
window.deleteRoom = async id => {
  if (!confirm('Delete this room?')) return;
  try { await api.del(`/rooms/${id}`); showToast('Room deleted.'); await loadData(); renderInventory(); }
  catch (e) { showToast('Delete failed: ' + e.message); }
};

function handleSeasonToggle(toHigh) {
  if (toHigh) {
    // Save current lo values before switching
    currentRoomRates.rate = $('room-rate').value;
    currentRoomRates.rate_weekend = $('room-rate-weekend').value;
    $('room-rate').value = currentRoomRates.rate_high || 0;
    $('room-rate-weekend').value = currentRoomRates.rate_high_weekend || 0;
  } else {
    // Save current hi values before switching
    currentRoomRates.rate_high = $('room-rate').value;
    currentRoomRates.rate_high_weekend = $('room-rate-weekend').value;
    $('room-rate').value = currentRoomRates.rate || 0;
    $('room-rate-weekend').value = currentRoomRates.rate_weekend || 0;
  }
  setSeasonUI(toHigh);
}

$('season-btn-lo')?.addEventListener('click', () => handleSeasonToggle(false));
$('season-btn-hi')?.addEventListener('click', () => handleSeasonToggle(true));

$('btn-add-room')?.addEventListener('click', () => { 
  $('room-modal-title').textContent = t('inv.add_room'); 
  $('room-form').reset(); 
  $('room-edit-id').value = '';
  document.querySelector('.btn-save-room').textContent = 'Add Room';
  currentRoomRates = { rate: 310000, rate_weekend: 310000, rate_high: 400000, rate_high_weekend: 400000 };
  setSeasonUI(false);
  $('room-rate').value = currentRoomRates.rate;
  $('room-rate-weekend').value = currentRoomRates.rate_weekend;
  $('room-modal').classList.add('active'); 
});
$('room-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const isHigh = isHighSeason();
  if (isHigh) {
    currentRoomRates.rate_high = $('room-rate').value;
    currentRoomRates.rate_high_weekend = $('room-rate-weekend').value;
  } else {
    currentRoomRates.rate = $('room-rate').value;
    currentRoomRates.rate_weekend = $('room-rate-weekend').value;
  }
  const data = { 
    name:$('room-name').value, location:$('room-location').value, capacity:+$('room-capacity').value, 
    rate:+currentRoomRates.rate, rate_weekend:+currentRoomRates.rate_weekend,
    rate_high:+currentRoomRates.rate_high, rate_high_weekend:+currentRoomRates.rate_high_weekend,
    is_high_season: isHigh, desc:$('room-desc').value 
  };
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
  const ci = $('form-checkin')?.value;
  const co = $('form-checkout')?.value;
  const applicable = app.promos.filter(p => {
    const st = promoStatus(p);
    if (st === 'inactive') return false;
    if (p.roomId !== 'all' && p.roomId !== roomId) return false;
    // If booking dates are set, only show promos whose period overlaps
    if (ci && co && p.startDate && p.endDate) {
      return ci <= p.endDate && co >= p.startDate;
    }
    return true;
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
    $('form-price').value = getRoomRate($('form-room').value||app.rooms[0]?.id||'r1', $('form-checkin').value, $('form-checkout').value); $('form-guests').value=1; $('form-cleaning').value=0; $('form-deposit').value=0; $('form-tax').value=0; $('form-checkin-time').value='14:00'; $('form-checkout-time').value='12:00';
    populatePromoSelect($('form-room').value||app.rooms[0]?.id||'');
  }
  currentFormAction = type; calcFormSummary(); $('form-modal').classList.add('active');
}
['form-checkin','form-checkout','form-price','form-cleaning','form-deposit','form-tax','form-additional'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', calcFormSummary); });
$('form-promo')?.addEventListener('change', calcFormSummary);
$('form-room')?.addEventListener('change', () => { $('form-price').value = getRoomRate($('form-room').value, $('form-checkin').value, $('form-checkout').value); populatePromoSelect($('form-room').value); calcFormSummary(); });
// Auto-recalculate rate and re-filter promos when dates change
['form-checkin','form-checkout'].forEach(id => { const el = $(id); if (el) el.addEventListener('change', () => { if ($('form-room').value) { $('form-price').value = getRoomRate($('form-room').value, $('form-checkin').value, $('form-checkout').value); } populatePromoSelect($('form-room').value); calcFormSummary(); }); });
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
  const createdDateRaw = b.createdAt ? b.createdAt.split(/[T ]/)[0] : _todayJkt;
  const docDateStr = shortDate(createdDateRaw);
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

  // Notes / Special Requests
  const notesRow = $('ipm-notes-row');
  if (notesRow) {
    if (b.notes && b.notes.trim()) {
      $('ipm-booking-notes').textContent = b.notes.trim();
      notesRow.style.display = '';
    } else {
      notesRow.style.display = 'none';
    }
  }

  // Payment Info — show ONLY for active quotations (within countdown, not expired/cancelled/invoice)
  const showPayInfo = b.type === 'quotation' && b.status !== 'cancelled' && effStatus(b) !== 'expired';
  const payRow = $('ipm-payment-row');
  if (payRow) payRow.style.display = showPayInfo ? '' : 'none';
  if (showPayInfo) {
    $('ipm-bank-name').textContent = app.settings.bankName || 'Bank Central Asia (BCA)';
    $('ipm-acc-name').textContent = 'Account Name: ' + (app.settings.accName || 'Thomas Vialdo Resky Lamandau');
    $('ipm-acc-no').textContent = 'Account No: ' + (app.settings.accNo || '060-132-7499');
  }
  const waIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="#000" style="flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  const igIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" style="flex-shrink:0;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
  $('ipm-c-phone').innerHTML = waIcon + (app.settings.phone||''); $('ipm-c-social').innerHTML = igIcon + (app.settings.social||'').replace(/^@/,''); $('ipm-footer-msg').textContent = app.settings.notes||'';
  const isCancelled = b.status==='cancelled';
  // Refund/No Refund row in IPM
  const refundRow   = $('ipm-row-refund');
  const noRefundRow = $('ipm-row-norefund');
  if (isCancelled && refundRow && noRefundRow) {
    if (b.noRefund) {
      refundRow.style.display = 'none';
      noRefundRow.style.display = '';
    } else if (b.refundAmount > 0) {
      $('ipm-t-refund').textContent = '-' + idr(b.refundAmount);
      $('ipm-refund-method-text').textContent = 'via ' + b.refundMethod;
      refundRow.style.display = '';
      noRefundRow.style.display = 'none';
    } else {
      refundRow.style.display = 'none';
      noRefundRow.style.display = 'none';
    }
  } else {
    if (refundRow)   refundRow.style.display = 'none';
    if (noRefundRow) noRefundRow.style.display = 'none';
  }
  $('ipm-btn-cancel').style.display = (b.type === 'invoice' && !isCancelled) ? '' : 'none';
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
  if (b.type === 'invoice') {
    // Invoice = guest has paid → show Refund / No Refund dialog
    $('cancel-confirm-modal').classList.add('active');
    lucide.createIcons();
  } else {
    // Quotation — simple cancel, no payment involved
    if (!confirm('Mark this quotation as cancelled?')) return;
    try { await api.del(`/bookings/${b.id}`); showToast('Booking marked as cancelled.'); await loadData(); closeIPM(); refreshCurrentPage(); }
    catch (e) { showToast('Cancel failed: ' + e.message); }
  }
});

function closeCancelModal() {
  $('cancel-confirm-modal').classList.remove('active');
  // Reset to step 1
  $('cancel-step-1').style.display = '';
  $('cancel-step-2').style.display = 'none';
  $('cancel-modal-title').textContent = 'Cancel Invoice';
}
async function _doCancel(noRefund, refundAmount, refundMethod) {
  closeCancelModal();
  const b = app.bookings.find(x => x.id === currentIPMId); if (!b) return;
  try {
    await api.post(`/bookings/${b.id}/cancel`, { noRefund, refundAmount: refundAmount || 0, refundMethod: refundMethod || '' });
    showToast(noRefund
      ? 'Invoice cancelled — No Refund. Payment retained.'
      : `Invoice cancelled — Refund of ${idr(refundAmount)} via ${refundMethod}.`);
    await loadData(); closeIPM(); refreshCurrentPage();
  } catch(e) { showToast('Cancel failed: ' + e.message); }
}
// Step 1: Refund → show step 2 form
window.cancelDoRefundClick = function() {
  const b = app.bookings.find(x => x.id === currentIPMId);
  $('refund-amount-input').value = b ? calcTotal(b) : '';
  $('refund-method-select').value = '';
  $('cancel-step-1').style.display = 'none';
  $('cancel-step-2').style.display = '';
  $('cancel-modal-title').textContent = 'Refund Details';
};
// Step 1: No Refund → cancel immediately
window.cancelNoRefundClick = function() { _doCancel(true, 0, ''); };
// Step 2: Cancel button → go back to step 1
window.cancelRefundBack = function() {
  $('cancel-step-2').style.display = 'none';
  $('cancel-step-1').style.display = '';
  $('cancel-modal-title').textContent = 'Cancel Invoice';
};
// Step 2: Refund button → validate & submit
window.cancelRefundConfirmClick = function() {
  const amt    = Number($('refund-amount-input').value) || 0;
  const method = $('refund-method-select').value;
  if (!method) { showToast('Please select a refund method.'); return; }
  _doCancel(false, amt, method);
};
$('cancel-confirm-modal')?.addEventListener('click', e => { if (e.target.id === 'cancel-confirm-modal') closeCancelModal(); });
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
  const [s, r, b, pr, gu] = await Promise.all([api.get('/settings'), api.get('/rooms'), api.get('/bookings'), api.get('/promos'), api.get('/guests')]);
  Object.assign(app.settings, s); app.rooms = r; app.bookings = b; app.promos = pr; app.guests = gu;
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
  const grand = roomAmt + (b.cleaningFee || 0) + (b.additionalFee || 0) + (b.deposit || 0) + taxAmt - discountAmt;
  const fmtMoney = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const todayStr = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'})).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const type = (b.type || 'booking').toUpperCase();
  const logoHtml = s.logo
    ? '<img src="'+s.logo+'" style="width:56px;height:56px;border-radius:12px;object-fit:cover">'
    : '<div style="width:56px;height:56px;border-radius:12px;background:#ffc823;display:flex;align-items:center;justify-content:center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>';
  // Payment info — only for active quotations (not expired/cancelled/invoice)
  const showPaymentInfo = b.type === 'quotation' && b.status !== 'cancelled' && effStatus(b) !== 'expired';
  let paymentHtml = '';
  if (showPaymentInfo) {
    paymentHtml = `<div class="pm">${s.bankName||'Bank Central Asia (BCA)'}</div><div class="pm">Account Name: ${s.accName||'Thomas Vialdo Resky Lamandau'}</div><div class="pm">Account No: ${s.accNo||'060-132-7499'}</div>`;
  }

  const win = window.open('', '_blank', 'width=860,height=1050');
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Terratjo '+type+'</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,Arial,sans-serif;font-size:13px;color:#1a1a2e;background:#fff;padding:36px 44px}.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #f0f0f0}.brand{display:flex;align-items:center;gap:14px}.bn{font-family:"Playfair Display",serif;font-size:22px;font-weight:700}.bs{font-size:12px;color:#888;margin-top:2px}.dt{font-family:"Playfair Display",serif;font-size:30px;font-weight:700;color:#ffc823;text-align:right}.dm{font-size:11px;color:#666;margin-top:4px;text-align:right}h3{font-size:13px;font-weight:700;margin:16px 0 8px;padding-bottom:5px;border-bottom:1px solid #f0f0f0}.lbl{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#888;margin-bottom:2px}.val{font-size:15px;font-weight:700;padding-bottom:6px;border-bottom:1.5px solid #ffc823;margin-bottom:10px}.vsm{font-size:13px;padding-bottom:5px;border-bottom:1px solid #eee;margin-bottom:10px}.meta{font-size:12px;color:#555;margin-bottom:3px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}hr{border:none;border-top:1px solid #f0f0f0;margin:16px 0}table{width:100%;border-collapse:collapse;margin:8px 0}thead tr{background:#1a1a2e}thead th{padding:8px 12px;font-size:11px;font-weight:600;color:#fff;text-align:left;text-transform:uppercase}thead th:last-child{text-align:right}tbody td{padding:7px 12px;font-size:12px;border-bottom:1px solid #f0f0f0}tbody td:last-child{text-align:right}tbody td[colspan="4"]{text-align:left!important}tbody tr:nth-child(even){background:#fafafa}.tt{background:#1a1a2e!important}.tt td{color:#ffc823;font-weight:700;font-size:13px;border:none}.pay{display:flex;justify-content:space-between;align-items:flex-start;border-top:1px solid #eee;padding-top:14px;margin-top:14px}.pl{font-weight:700;font-size:12px;margin-bottom:6px}.pm{font-size:11px;color:#444;margin-bottom:3px}.nb{background:#fffbeb;border-left:3px solid #ffc823;border-radius:4px;padding:10px 14px;font-size:12px;margin:12px 0}footer{text-align:center;padding-top:12px;border-top:1px solid #eee;margin-top:12px;font-size:11px;color:#999}@media print{body{padding:10mm 12mm}@page{size:A4 portrait;margin:0}}</style></head><body>'
    + '<div class="hdr"><div class="brand">'+logoHtml+'<div><div class="bn">'+(s.brand||'Terratjo Room')+'</div><div class="bs">'+(s.invAddress||'')+'</div></div></div>'
    + '<div><div class="dt">'+type+'</div><div class="dm" style="font-weight:700; color:#1a1a2e; margin-bottom: 2px;">'+b.id+'</div><div class="dm">Date: '+ (b.createdAt ? fmtDate(b.createdAt.split(/[T ]/)[0]) : todayStr) +'</div></div></div>'
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
    + (b.status === 'cancelled' ? (
        b.noRefund
          ? '<tr><td colspan="4" style="color:#ef4444;font-weight:700;padding-top:6px;font-size:12px;">\u26a0 No Refund \u2014 payment retained by property</td></tr>'
          : b.refundAmount > 0
            ? '<tr style="color:#ef4444"><td colspan="3"><strong style="color:#ef4444">Refund</strong> <span style="font-size:11px">via '+b.refundMethod+'</span></td><td style="color:#ef4444;font-weight:700;">-'+fmtMoney(b.refundAmount)+'</td></tr>'
            : ''
      ) : '')
    + '</tbody></table>'
    + (b.notes ? '<div class="nb"><b>Notes / Special Requests:</b> '+b.notes+'</div>' : '')
    + (showPaymentInfo ? '<div class="pay"><div><div class="pl">Payment Info:</div>' + paymentHtml + '</div></div>' : '')
    + '<footer>'+(s.notes||'Thank you for your booking.')+'</footer>'
    + '<div style="display:flex;gap:20px;padding-top:10px;border-top:1px solid #eee;margin-top:10px;justify-content:center;align-items:center;">'
    + '<div class="pm" style="display:inline-flex;align-items:center;gap:5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'+(s.social||'').replace(/^@/,'')+'</div>'
    + '<div class="pm" style="display:inline-flex;align-items:center;gap:5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="#000"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'+(s.phone||'')+'</div>'
    + '</div>'
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
    <thead><tr><th>${t('th.desc')}</th><th>${t('th.room')}</th><th>${t('th.discount')}</th><th style="text-align:center">${t('th.period')}</th><th>${t('th.status')}</th><th></th></tr></thead>
    <tbody>${app.promos.map(p => {
      const st = promoStatus(p);
      const disc = p.type === 'percentage' ? `-${p.value}%` : `-${idr(p.value)}`;
      const room = p.roomId === 'all' ? t('promo.all_rooms') : getRoomName(p.roomId);
      const period = p.startDate && p.endDate ? `${shortDate(p.startDate)} → ${shortDate(p.endDate)}` : '—';
      return `<tr>
        <td><strong>${p.name}</strong></td>
        <td>${room}</td>
        <td style="color:#16a34a;font-weight:700;">${disc}</td>
        <td style="font-size:12px;text-align:center;">${period}</td>
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

// ── Guests Data ───────────────────────────────────────────────────
// Match a guest to bookings by name + email (mirrors the backend dedup key)
function _guestBookings(g) {
  const nameNorm  = (g.name  || '').toLowerCase().trim();
  const emailNorm = (g.email || '').toLowerCase().trim();
  return (app.bookings || []).filter(b => {
    const bName  = (b.guestName  || '').toLowerCase().trim();
    const bEmail = (b.guestEmail || '').toLowerCase().trim();
    return bName === nameNorm && bEmail === emailNorm;
  });
}

// Earliest booking created_at → shown as "First Created" (more accurate than DB insert time)
function getFirstBookingDate(g) {
  const matches = _guestBookings(g).filter(b => b.createdAt);
  if (!matches.length) return g.createdAt ? g.createdAt.split(/[T ]/)[0] : null;
  const earliest = matches.reduce((min, b) => b.createdAt < min ? b.createdAt : min, matches[0].createdAt);
  return earliest.split(/[T ]/)[0];
}

// Latest checkout date — only Invoice type, non-cancelled (Quotation/Expired = guest never stayed)
function getLastStay(g) {
  const stays = _guestBookings(g).filter(b =>
    b.type === 'invoice' &&
    b.status !== 'cancelled' &&
    b.checkout
  );
  if (!stays.length) return null;
  return stays.reduce((max, b) => b.checkout > max ? b.checkout : max, '');
}

function formatShortAddress(addr) {
  if (!addr || !addr.trim()) return '';
  const str = addr.trim();
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return parts.slice(-2).join(', ').replace(/^Kabupaten\s+/i, '');
  }
  return str;
}

window.renderGuests = function(filter) {
  const tb = $('guests-tbody'); if (!tb) return;
  const q = (filter || '').toLowerCase().trim();
  const list = (app.guests||[]).filter(g =>
    !q || g.name.toLowerCase().includes(q) || (g.email||'').toLowerCase().includes(q) || (g.phone||'').includes(q) || (g.address||'').toLowerCase().includes(q)
  );
  if (!list.length) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-light)">${q ? 'No guests match your search.' : 'No guests yet. They will appear here after your first booking.'}</td></tr>`;
    return;
  }
  tb.innerHTML = list.map(g => {
    const firstDate = getFirstBookingDate(g);
    const last      = getLastStay(g);
    const displayAddr = formatShortAddress(g.address);
    const dateBadgeHtml = firstDate ? `<span class="guest-date-badge">${shortDate(firstDate)}</span>` : '';
    return `<tr onclick="openGuestModal('${g.id}')" title="Click to view/edit ${g.name.replace(/"/g,'&quot;')}">
      <td class="td-g-name">
        <div class="td-guest-name">${g.name}</div>
        <div class="mobile-g-created">${dateBadgeHtml}</div>
      </td>
      <td class="td-g-email">${g.email ? `<a href="mailto:${g.email}" onclick="event.stopPropagation()" style="color:var(--primary)">${g.email}</a>` : '<span class="g-dash">—</span>'}</td>
      <td class="td-g-phone">${g.phone ? `<span>${g.phone}</span>` : '<span class="g-dash">—</span>'}</td>
      <td class="td-g-address">${g.address ? `<span class="td-address" title="${(g.address||'').replace(/"/g,'&quot;')}">${displayAddr}</span>` : '<span class="g-dash">—</span>'}</td>
      <td class="td-g-created">${dateBadgeHtml || '<span class="g-dash">—</span>'}</td>
      <td class="td-g-laststay">${last ? `<span class="g-laststay-val">Last stay: ${shortDate(last)}</span>` : '<span class="g-dash">—</span>'}</td>
    </tr>`;
  }).join('');
  lucide.createIcons();
};

let _editGuestId = null;
window.openGuestModal = function(id) {
  _editGuestId = id;
  const g = id ? (app.guests||[]).find(x => x.id === id) : null;
  $('guest-modal-title').textContent = g ? 'Edit Guest' : 'Add Guest';
  $('gf-name').value    = g?.name    || '';
  $('gf-email').value   = g?.email   || '';
  $('gf-phone').value   = g?.phone   || '';
  $('gf-address').value = g?.address || '';
  if ($('gf-btn-delete')) $('gf-btn-delete').style.display = g ? 'inline-flex' : 'none';
  $('guest-modal').classList.add('active');
  lucide.createIcons();
  setTimeout(() => $('gf-name').focus(), 80);
};

window.deleteGuestFromModal = async function() {
  if (!_editGuestId) return;
  const g = (app.guests||[]).find(x => x.id === _editGuestId);
  const name = g ? g.name : 'this guest';
  if (!confirm(`Delete guest "${name}"? This does not affect existing bookings.`)) return;
  try {
    await api.del(`/guests/${_editGuestId}`);
    showToast('Guest deleted.');
    $('guest-modal').classList.remove('active');
    await loadData();
    renderGuests($('guest-search')?.value || '');
  } catch(e) { showToast('Delete failed: ' + e.message); }
};

window.deleteGuest = async function(id, name) {
  if (!confirm(`Delete guest "${name}"? This does not affect existing bookings.`)) return;
  try {
    await api.del(`/guests/${id}`);
    showToast('Guest deleted.');
    await loadData();
    renderGuests($('guest-search')?.value || '');
  } catch(e) { showToast('Delete failed: ' + e.message); }
};

$('guest-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    name: $('gf-name').value.trim(),
    email: $('gf-email').value.trim(),
    phone: $('gf-phone').value.trim(),
    address: $('gf-address').value.trim()
  };
  if (!data.name) { showToast('Name is required.'); return; }
  try {
    if (_editGuestId) { await api.put(`/guests/${_editGuestId}`, data); showToast('Guest updated!'); }
    else { await api.post('/guests', data); showToast('Guest added!'); }
    $('guest-modal').classList.remove('active');
    await loadData();
    renderGuests($('guest-search')?.value || '');
    lucide.createIcons();
  } catch(e) { showToast('Save failed: ' + e.message); }
});

// ── Guest Name Autocomplete ───────────────────────────────────────
(function() {
  const inp = $('form-name');
  const list = $('guest-ac-list');
  if (!inp || !list) return;

  function showAC(val) {
    const q = val.toLowerCase().trim();
    list.innerHTML = '';
    if (!q || !(app.guests||[]).length) { list.style.display='none'; return; }
    const hits = app.guests.filter(g => g.name.toLowerCase().includes(q) || (g.email||'').toLowerCase().includes(q)).slice(0,8);
    if (!hits.length) { list.style.display='none'; return; }
    hits.forEach(g => {
      const div = document.createElement('div');
      div.className = 'guest-ac-item';
      div.innerHTML = `<span class="guest-ac-name">${g.name}</span><span class="guest-ac-meta">${[g.email,g.phone,g.address].filter(Boolean).join(' · ')}</span>`;
      div.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent blur before click
        inp.value          = g.name;
        $('form-email').value = g.email || '';
        $('form-phone').value = g.phone || '';
        if ($('form-address')) $('form-address').value = g.address || '';
        list.style.display = 'none';
        checkFormValidity();
      });
      list.appendChild(div);
    });
    list.style.display = 'block';
  }

  inp.addEventListener('input',  () => { showAC(inp.value); checkFormValidity(); });
  inp.addEventListener('focus',  () => showAC(inp.value));
  inp.addEventListener('blur',   () => setTimeout(() => { list.style.display='none'; }, 150));
  document.addEventListener('click', e => { if (!e.target.closest('.guest-ac-wrap')) list.style.display='none'; });
})();

// ── Form Validity (mandatory fields) ─────────────────────────────
const _requiredFormIds = ['form-name','form-email','form-phone','form-guests','form-address'];

function checkFormValidity() {
  const ok = _requiredFormIds.every(id => { const el = $(id); return el && el.value.trim() !== ''; });
  ['btn-create-booking-form','btn-create-quotation-form'].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.45';
    btn.style.cursor  = ok ? '' : 'not-allowed';
  });
}

_requiredFormIds.forEach(id => {
  $(id)?.addEventListener('input', checkFormValidity);
  $(id)?.addEventListener('change', checkFormValidity);
});

// Run on form open — patch into the existing openForm function
const _origOpenForm = window.openForm;
window.openForm = function(type, dateStr, prefillId) {
  _origOpenForm(type, dateStr, prefillId);
  // Small delay to let the form populate before checking validity
  setTimeout(checkFormValidity, 50);
};

// ── Guests Autocomplete CSS (injected once) ───────────────────────
(function() {
  const s = document.createElement('style');
  s.textContent = `
    .guest-ac-list{display:none;position:absolute;top:100%;left:0;right:0;z-index:9999;background:var(--surface,#fff);border:1.5px solid var(--border,#e5e7eb);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:220px;overflow-y:auto;margin-top:4px;}
    .guest-ac-item{padding:10px 14px;cursor:pointer;display:flex;flex-direction:column;gap:2px;transition:background .12s;}
    .guest-ac-item:hover{background:var(--hover,#f8fafc);}
    .guest-ac-name{font-size:14px;font-weight:600;color:var(--text,#1e293b);}
    .guest-ac-meta{font-size:11px;color:var(--text-light,#64748b);}
  `;
  document.head.appendChild(s);
})();

// ── Booking Hover Tooltip ─────────────────────────────────────────
(function() {
  const STATUS_CFG = {
    confirmed:  { bg:'#dcfce7', color:'#166534', dot:'#16a34a',  label:'Confirmed' },
    awaiting:   { bg:'rgba(217,119,6,.12)', color:'#92400e', dot:'#d97706', label:'Awaiting Payment' },
    quotation:  { bg:'rgba(37,99,235,.1)',  color:'#1e40af', dot:'#2563eb', label:'Quotation' },
    completed:  { bg:'rgba(15,118,110,.12)',color:'#0f766e', dot:'#0f766e', label:'Completed' },
    cancelled:  { bg:'rgba(220,38,38,.08)', color:'#b91c1c', dot:'#dc2626', label:'Cancelled' },
    expired:    { bg:'rgba(220,38,38,.12)', color:'#b91c1c', dot:'#dc2626', label:'Expired' },
  };

  const getTip = () => document.getElementById('booking-tooltip');

  function buildTip(b) {
    const n   = nightsCount(b.checkin, b.checkout);
    const tot = calcTotal(b);
    const st  = effStatus(b);
    const sc  = STATUS_CFG[st] || { bg:'#f1f5f9', color:'#334155', dot:'#64748b', label: st };
    const promo = b.promoId ? (app.promos||[]).find(p => p.id === b.promoId) : null;
    const promoHtml = promo
      ? `<div class="btt-promo">🏷️ ${promo.name||promo.code||'Promo'} &nbsp;${
          promo.type==='percentage' ? `<span>-${promo.value}%</span>` : `<span>-${idr(Number(promo.value))}</span>`
        }</div>`
      : '';
    const notes = b.notes && b.notes.trim()
      ? `<div class="btt-notes">"${b.notes.trim().slice(0,90)}${b.notes.length>90?'…':''}"</div>`
      : '';
    const refundBadge = (b.status === 'cancelled' && b.type === 'invoice')
      ? b.noRefund
        ? `<span class="btt-status" style="background:#fef2f2;color:#ef4444;border:1.5px solid #ef4444;"><span class="btt-dot" style="background:#ef4444;"></span>No Refund</span>`
        : b.refundAmount > 0
          ? `<span class="btt-status" style="background:#fef2f2;color:#ef4444;border:1.5px solid #ef4444;"><span class="btt-dot" style="background:#ef4444;"></span>Refund</span>`
          : ''
      : '';
    return `
      <div class="btt-header">
        <div style="display:flex;align-items:center;gap:4px;">
          <span class="btt-status" style="background:${sc.bg};color:${sc.color};">
            <span class="btt-dot" style="background:${sc.dot};"></span>${sc.label}
          </span>
          ${refundBadge}
        </div>
        <span class="btt-id">${b.id}</span>
      </div>
      <div class="btt-name">${b.guestName}</div>
      <div class="btt-meta"><span class="btt-meta-icon">🏠</span>${getRoomName(b.room)}</div>
      <div class="btt-meta"><span class="btt-meta-icon">📅</span>${shortDate(b.checkin)} → ${shortDate(b.checkout)}</div>
      <div class="btt-meta"><span class="btt-meta-icon">🌙</span>${n} ${n===1?'night':'nights'}</div>
      ${b.guestEmail ? `<div class="btt-meta"><span class="btt-meta-icon">✉️</span>${b.guestEmail}</div>` : ''}
      <hr class="btt-divider">
      ${promoHtml}
      <div class="btt-total">${idr(tot)}</div>
      ${notes}
      <button class="btt-view-btn" onclick="hideBookingTooltip();openIPM('${b.id}')">View Details →</button>`;
  }

  let _bid = null, _hideTimer = null, _switchTimer = null;

  function placeAt(tip, cx, cy) {
    const tw = 292, th = tip.offsetHeight || 280;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = cx + 22;
    let top  = cy - Math.round(th / 2);
    if (left + tw > vw - 10) left = cx - tw - 22;
    if (left < 8) left = 8;
    if (top + th > vh - 10) top = vh - th - 10;
    if (top < 8) top = 8;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }

  function renderTip(bid, cx, cy) {
    const tip = getTip();
    if (!tip || !app.bookings) return;
    const b = app.bookings.find(x => x.id === bid);
    if (!b) return;
    _bid = bid;
    tip.innerHTML = buildTip(b);
    placeAt(tip, cx, cy);
    tip.classList.add('btt-visible');
  }

  window.hideBookingTooltip = function() {
    clearTimeout(_hideTimer);
    clearTimeout(_switchTimer);
    _hideTimer = setTimeout(() => {
      const tip = getTip();
      if (tip) tip.classList.remove('btt-visible');
      _bid = null;
    }, 150);
  };

  // Keep tooltip alive when cursor is inside it
  document.addEventListener('DOMContentLoaded', () => {
    const tip = getTip();
    if (!tip) return;
    tip.addEventListener('mouseenter', () => { clearTimeout(_hideTimer); clearTimeout(_switchTimer); });
    tip.addEventListener('mouseleave', window.hideBookingTooltip);
  });

  // Use mouseover (bubbles) for delegation — fires once when entering element
  document.addEventListener('mouseover', e => {
    const tip = getTip();
    // Cursor entered the tooltip — cancel any pending actions
    if (tip && tip.contains(e.target)) {
      clearTimeout(_hideTimer);
      clearTimeout(_switchTimer);
      return;
    }
    const el = e.target.closest('[data-bid]');
    if (!el) return;

    const bid = el.dataset.bid;
    clearTimeout(_hideTimer);

    if (_bid === bid) {
      // Re-entering same row — just keep visible, no reposition
      if (tip) tip.classList.add('btt-visible');
      return;
    }

    if (!_bid) {
      // No tooltip showing — show immediately at cursor entry point
      renderTip(bid, e.clientX, e.clientY);
    } else {
      // Already showing a different booking — debounce 350ms before switching
      // This lets the cursor pass briefly over another row en route to the tooltip
      clearTimeout(_switchTimer);
      _switchTimer = setTimeout(() => {
        renderTip(bid, e.clientX, e.clientY);
      }, 350);
    }
  });

  // Use mouseout to detect leaving rows
  document.addEventListener('mouseout', e => {
    const going = e.relatedTarget;
    const tip = getTip();
    // Cursor moving into tooltip — keep alive
    if (tip && going && tip.contains(going)) return;
    // Cursor moving into another [data-bid] row — mouseover will handle it
    if (going && going.closest && going.closest('[data-bid]')) return;
    // Leaving a [data-bid] row for an unrelated area — hide
    if (e.target.closest && e.target.closest('[data-bid]')) {
      window.hideBookingTooltip();
    }
  });

  // ── Mobile / touch: handleRowClick replaces openIPM on table rows ──────
  // Defined directly in IIFE (no DOMContentLoaded dependency) so it's
  // always available when inline onclick fires.
  const isMobileTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  function mobilePlaceAt(tip) {
    const tw = Math.min(292, window.innerWidth - 24);
    const left = Math.round((window.innerWidth - tw) / 2);
    const top  = Math.round(window.innerHeight * 0.18);
    tip.style.width = tw + 'px';
    tip.style.left  = left + 'px';
    tip.style.top   = top  + 'px';
  }

  // Called by: onclick="handleRowClick('...')" on every booking table row
  window.handleRowClick = function(id) {
    if (!isMobileTouch()) {
      // Desktop — open the full preview modal normally
      if (window.openIPM) window.openIPM(id);
      return;
    }

    const tip = getTip();
    clearTimeout(_hideTimer);
    clearTimeout(_switchTimer);

    if (_bid === id && tip && tip.classList.contains('btt-visible')) {
      // 2nd tap on same row → dismiss tooltip
      tip.classList.remove('btt-visible');
      _bid = null;
      return;
    }

    // 1st tap (or different row) → show tooltip, do NOT open IPM
    const b = app.bookings && app.bookings.find(x => x.id === id);
    if (!b || !tip) {
      // Fallback: no data, just open normally
      if (window.openIPM) window.openIPM(id);
      return;
    }
    if (tip.classList.contains('btt-visible')) {
      tip.classList.remove('btt-visible');
      _bid = null;
    }
    _bid = id;
    tip.innerHTML = buildTip(b);
    mobilePlaceAt(tip);
    tip.classList.add('btt-visible');
  };

  // Dismiss tooltip when tapping anywhere outside a row or the tooltip
  document.addEventListener('click', e => {
    if (!isMobileTouch()) return;
    const tip = getTip();
    if (!tip || !_bid) return;
    if (tip.contains(e.target)) return;                           // inside tooltip — allow
    if (e.target.closest && e.target.closest('[data-bid]')) return; // row — handleRowClick handles
    tip.classList.remove('btt-visible');
    _bid = null;
  });
})();
