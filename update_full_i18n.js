const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// Calendar Legend
html = html.replace('<span class="legend-item"><span class="dot dot-confirmed"></span> Confirmed</span>', '<span class="legend-item"><span class="dot dot-confirmed"></span> <span data-i18n="st.confirmed">Confirmed</span></span>');
html = html.replace('<span class="legend-item"><span class="dot dot-awaiting"></span> Awaiting Payment</span>', '<span class="legend-item"><span class="dot dot-awaiting"></span> <span data-i18n="st.awaiting">Awaiting Payment</span></span>');
html = html.replace('<span class="legend-item"><span class="dot dot-quotation"></span> Quotation</span>', '<span class="legend-item"><span class="dot dot-quotation"></span> <span data-i18n="st.quotation">Quotation</span></span>');
html = html.replace('<span class="legend-item"><span class="dot dot-cancelled"></span> Cancelled/Expired</span>', '<span class="legend-item"><span class="dot dot-cancelled"></span> <span data-i18n="st.cancelled_exp">Cancelled/Expired</span></span>');

// Calendar Header Days
html = html.replace('<span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>', '<span data-i18n="cal.su">SUN</span><span data-i18n="cal.mo">MON</span><span data-i18n="cal.tu">TUE</span><span data-i18n="cal.we">WED</span><span data-i18n="cal.th">THU</span><span data-i18n="cal.fr">FRI</span><span data-i18n="cal.sa">SAT</span>');

// Bookings Tabs
html = html.replace('<button class="tab-btn active" data-filter="all">All</button>', '<button class="tab-btn active" data-filter="all" data-i18n="tab.all">All</button>');
html = html.replace('<button class="tab-btn" data-filter="confirmed">Confirmed</button>', '<button class="tab-btn" data-filter="confirmed" data-i18n="st.confirmed">Confirmed</button>');
html = html.replace('<button class="tab-btn" data-filter="awaiting">Awaiting Payment</button>', '<button class="tab-btn" data-filter="awaiting" data-i18n="st.awaiting">Awaiting Payment</button>');
html = html.replace('<button class="tab-btn" data-filter="quotation">Quotations</button>', '<button class="tab-btn" data-filter="quotation" data-i18n="tab.quotations">Quotations</button>');
html = html.replace('<button class="tab-btn" data-filter="cancelled">Cancelled / Expired</button>', '<button class="tab-btn" data-filter="cancelled" data-i18n="st.cancelled_exp">Cancelled / Expired</button>');

// Filter Select
html = html.replace('<option value="all">All Bookings</option>', '<option value="all" data-i18n="nav.bookings">All Bookings</option>');
html = html.replace('<option value="confirmed">Confirmed</option>', '<option value="confirmed" data-i18n="st.confirmed">Confirmed</option>');
html = html.replace('<option value="awaiting">Awaiting Payment</option>', '<option value="awaiting" data-i18n="st.awaiting">Awaiting Payment</option>');
html = html.replace('<option value="quotation">Quotations</option>', '<option value="quotation" data-i18n="tab.quotations">Quotations</option>');
html = html.replace('<option value="cancelled">Cancelled / Expired</option>', '<option value="cancelled" data-i18n="st.cancelled_exp">Cancelled / Expired</option>');

// Invoices Tabs
html = html.replace('<button class="tab-btn active" data-filter="all">All</button>', '<button class="tab-btn active" data-filter="all" data-i18n="tab.all">All</button>');
html = html.replace('<button class="tab-btn" data-filter="invoice">Invoices</button>', '<button class="tab-btn" data-filter="invoice" data-i18n="tab.invoices">Invoices</button>');
html = html.replace('<button class="tab-btn" data-filter="quotation">Quotations</button>', '<button class="tab-btn" data-filter="quotation" data-i18n="tab.quotations">Quotations</button>');

// Reports Tabs & Headers
html = html.replace('<h3>Transaction Overview</h3>', '<h3 data-i18n="rep.trans_overview">Transaction Overview</h3>');
html = html.replace('<button class="tab-btn active" data-filter="all">All</button>', '<button class="tab-btn active" data-filter="all" data-i18n="tab.all">All</button>');
html = html.replace('<button class="tab-btn" data-filter="booking">Bookings</button>', '<button class="tab-btn" data-filter="booking" data-i18n="tab.bookings">Bookings</button>');
html = html.replace('<button class="tab-btn" data-filter="quotation">Quotations</button>', '<button class="tab-btn" data-filter="quotation" data-i18n="tab.quotations">Quotations</button>');
html = html.replace('<th>CHECK-IN</th><th>CHECK-OUT</th><th>NIGHTS</th>', '<th data-i18n="th.checkin">CHECK-IN</th><th data-i18n="th.checkout">CHECK-OUT</th><th data-i18n="th.nights">NIGHTS</th>');

// Inventory
html = html.replace('<h2>Rooms / Inventory</h2>', '<h2 data-i18n="inv.title">Rooms / Inventory</h2>');
html = html.replace('<button class="btn btn-primary" id="btn-add-room"><i data-lucide="plus"></i> Add Room</button>', '<button class="btn btn-primary" id="btn-add-room"><i data-lucide="plus"></i> <span data-i18n="inv.add_room">Add Room</span></button>');

// Settings Form
html = html.replace('<label>PROPERTY LOGO</label>', '<label data-i18n="set.logo">PROPERTY LOGO</label>');
html = html.replace('<span class="logo-upload-hint-title">Click to upload logo</span>', '<span class="logo-upload-hint-title" data-i18n="set.logo_hint">Click to upload logo</span>');
html = html.replace('<span class="logo-upload-hint-sub">PNG, JPG or SVG · Recommended 200×200px</span>', '<span class="logo-upload-hint-sub" data-i18n="set.logo_sub">PNG, JPG or SVG · Recommended 200×200px</span>');
html = html.replace('id="btn-remove-logo" style="display:none" onclick="event.stopPropagation();removeLogo()">Remove Logo</button>', 'id="btn-remove-logo" style="display:none" onclick="event.stopPropagation();removeLogo()" data-i18n="set.logo_rm">Remove Logo</button>');
html = html.replace('<label>Brand / Property Name</label>', '<label data-i18n="set.brand">Brand / Property Name</label>');
html = html.replace('<label>Tagline / Sub-brand</label>', '<label data-i18n="set.tagline">Tagline / Sub-brand</label>');
html = html.replace('<label>Location / Address (Top Bar)</label>', '<label data-i18n="set.loc">Location / Address (Top Bar)</label>');
html = html.replace('<label>Invoice Header Address</label>', '<label data-i18n="set.inv_add">Invoice Header Address</label>');
html = html.replace('<label>Contact Email</label>', '<label data-i18n="set.email">Contact Email</label>');
html = html.replace('<label>Contact Phone / WA</label>', '<label data-i18n="set.phone">Contact Phone / WA</label>');
html = html.replace('<label>Website (Optional)</label>', '<label data-i18n="set.web">Website (Optional)</label>');
html = html.replace('<label>Bank Name</label>', '<label data-i18n="set.bank">Bank Name</label>');
html = html.replace('<label>Account Number</label>', '<label data-i18n="set.acc_no">Account Number</label>');
html = html.replace('<label>Account Holder Name</label>', '<label data-i18n="set.acc_name">Account Holder Name</label>');
html = html.replace('<label>Payment Instructions / Terms</label>', '<label data-i18n="set.terms">Payment Instructions / Terms</label>');

// Room Modal
html = html.replace('<label>Room Name</label>', '<label data-i18n="inv.lbl_name">Room Name</label>');
html = html.replace('<label>Location</label>', '<label data-i18n="inv.lbl_loc">Location</label>');
html = html.replace('<label>Capacity (Max Guests)</label>', '<label data-i18n="inv.lbl_cap">Capacity (Max Guests)</label>');
html = html.replace('<label>Rate per night (Rp)</label>', '<label data-i18n="inv.lbl_rate">Rate per night (Rp)</label>');
html = html.replace('<label>Description</label>', '<label data-i18n="inv.lbl_desc">Description</label>');
html = html.replace('<button type="submit" class="btn btn-primary" id="btn-save-room">Save Room</button>', '<button type="submit" class="btn btn-primary" id="btn-save-room" data-i18n="inv.save">Save Room</button>');
html = html.replace('<button type="button" class="btn btn-outline" id="btn-cancel-room">Cancel</button>', '<button type="button" class="btn btn-outline" id="btn-cancel-room" data-i18n="btn.cancel">Cancel</button>');

fs.writeFileSync('public/index.html', html);


// 2. Update client.js LANG object
let js = fs.readFileSync('public/client.js', 'utf8');

const langMatches = js.match(/const LANG = \{([\s\S]*?)\n\};/);
if (langMatches) {
  let langStr = langMatches[0];

  const enAdds = `
    'st.cancelled_exp':'Cancelled/Expired',
    'tab.all':'All', 'tab.quotations':'Quotations', 'tab.invoices':'Invoices', 'tab.bookings':'Bookings',
    'rep.trans_overview':'Transaction Overview',
    'inv.title':'Rooms / Inventory', 'inv.add_room':'Add Room', 'inv.edit_room':'Edit Room',
    'inv.lbl_name':'Room Name', 'inv.lbl_loc':'Location', 'inv.lbl_cap':'Capacity (Max Guests)', 'inv.lbl_rate':'Rate per night (Rp)', 'inv.lbl_desc':'Description', 'inv.save':'Save Room',
    'set.logo':'PROPERTY LOGO', 'set.logo_hint':'Click to upload logo', 'set.logo_sub':'PNG, JPG or SVG · Recommended 200x200px', 'set.logo_rm':'Remove Logo',
    'set.brand':'Brand / Property Name', 'set.tagline':'Tagline / Sub-brand', 'set.loc':'Location / Address (Top Bar)', 'set.inv_add':'Invoice Header Address',
    'set.email':'Contact Email', 'set.phone':'Contact Phone / WA', 'set.web':'Website (Optional)', 'set.bank':'Bank Name', 'set.acc_no':'Account Number', 'set.acc_name':'Account Holder Name', 'set.terms':'Payment Instructions / Terms'
  `;

  const idAdds = `
    'st.cancelled_exp':'Dibatalkan/Kedaluwarsa',
    'tab.all':'Semua', 'tab.quotations':'Penawaran', 'tab.invoices':'Faktur', 'tab.bookings':'Pemesanan',
    'rep.trans_overview':'Ringkasan Transaksi',
    'inv.title':'Kamar / Inventaris', 'inv.add_room':'Tambah Kamar', 'inv.edit_room':'Ubah Kamar',
    'inv.lbl_name':'Nama Kamar', 'inv.lbl_loc':'Lokasi', 'inv.lbl_cap':'Kapasitas (Maks Tamu)', 'inv.lbl_rate':'Tarif per malam (Rp)', 'inv.lbl_desc':'Deskripsi', 'inv.save':'Simpan Kamar',
    'set.logo':'LOGO PROPERTI', 'set.logo_hint':'Klik untuk mengunggah logo', 'set.logo_sub':'PNG, JPG, atau SVG · Disarankan 200x200px', 'set.logo_rm':'Hapus Logo',
    'set.brand':'Nama Merek / Properti', 'set.tagline':'Slogan / Sub-merek', 'set.loc':'Lokasi / Alamat (Top Bar)', 'set.inv_add':'Alamat Kop Faktur',
    'set.email':'Email Kontak', 'set.phone':'Telepon / WA', 'set.web':'Situs Web (Opsional)', 'set.bank':'Nama Bank', 'set.acc_no':'Nomor Rekening', 'set.acc_name':'Nama Pemilik Rekening', 'set.terms':'Instruksi / Syarat Pembayaran'
  `;

  langStr = langStr.replace(/('btn.view': 'View'[\n\s]*)\},/, `$1,    ${enAdds}\n  },`);
  langStr = langStr.replace(/('btn.view': 'Lihat'[\n\s]*)\}\n\};/, `$1,    ${idAdds}\n  }\n};`);

  js = js.replace(langMatches[0], langStr);
}

// 3. Update JS references
js = js.replace("$('room-modal-title').textContent = 'Add Room';", "$('room-modal-title').textContent = t('inv.add_room');");
js = js.replace("$('room-modal-title').textContent = 'Edit Room';", "$('room-modal-title').textContent = t('inv.edit_room');");

fs.writeFileSync('public/client.js', js);
