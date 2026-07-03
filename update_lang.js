const fs = require('fs');

let clientCode = fs.readFileSync('public/client.js', 'utf8');

// Add translation helper
if (!clientCode.includes('function t(key)')) {
  clientCode = clientCode.replace('window.setLanguage = setLanguage;', "window.setLanguage = setLanguage;\nwindow.t = function(key) { return (LANG[currentLang] && LANG[currentLang][key]) || (LANG['en'] && LANG['en'][key]) || key; };");
}

// Update the LANG object
const langMatches = clientCode.match(/const LANG = \{([\s\S]*?)\n\};/);
if (langMatches) {
  let langStr = langMatches[0];
  
  const enAdds = `
    'th.guest':'GUEST', 'th.room':'ROOM', 'th.checkin':'CHECK-IN', 'th.checkout':'CHECK-OUT', 'th.nights':'NIGHTS', 'th.total':'TOTAL', 'th.status':'STATUS', 'th.type':'TYPE', 'th.dates':'DATES', 'th.rate':'RATE/NIGHT', 'th.desc':'Description', 'th.qty':'Quantity', 'th.amount':'Amount',
    'lbl.night':'night', 'lbl.nights':'nights', 'lbl.no_bookings':'No bookings found.', 'lbl.no_documents':'No documents found.',
    'st.confirmed':'Confirmed', 'st.awaiting':'Awaiting Payment', 'st.quotation':'Quotation', 'st.cancelled':'Cancelled', 'st.expired':'Expired', 'st.invoice':'Invoice',
    'rep.rev':'Total Revenue', 'rep.from_bookings':'from bookings', 'rep.confirmed':'Confirmed', 'rep.bookings':'bookings', 'rep.awaiting':'Awaiting Payment', 'rep.need_follow':'need follow-up', 'rep.quotations':'Quotations', 'rep.cancelled_exp':'cancelled/expired',
    'inv.max':'Max', 'inv.guests':'guests', 'inv.night':'night', 'inv.edit':'Edit', 'inv.delete':'Delete', 'inv.add_room':'Add Room',
    'cal.jan':'January', 'cal.feb':'February', 'cal.mar':'March', 'cal.apr':'April', 'cal.may':'May', 'cal.jun':'June', 'cal.jul':'July', 'cal.aug':'August', 'cal.sep':'September', 'cal.oct':'October', 'cal.nov':'November', 'cal.dec':'December',
    'cal.su':'Su', 'cal.mo':'Mo', 'cal.tu':'Tu', 'cal.we':'We', 'cal.th':'Th', 'cal.fr':'Fr', 'cal.sa':'Sa',
    'btn.preview': 'Preview', 'btn.view': 'View'
  `;
  
  const idAdds = `
    'th.guest':'TAMU', 'th.room':'KAMAR', 'th.checkin':'CHECK-IN', 'th.checkout':'CHECK-OUT', 'th.nights':'MALAM', 'th.total':'TOTAL', 'th.status':'STATUS', 'th.type':'TIPE', 'th.dates':'TANGGAL', 'th.rate':'TARIF/MALAM', 'th.desc':'Deskripsi', 'th.qty':'Jumlah', 'th.amount':'Jumlah',
    'lbl.night':'malam', 'lbl.nights':'malam', 'lbl.no_bookings':'Tidak ada pemesanan ditemukan.', 'lbl.no_documents':'Tidak ada dokumen ditemukan.',
    'st.confirmed':'Terkonfirmasi', 'st.awaiting':'Menunggu Pembayaran', 'st.quotation':'Penawaran', 'st.cancelled':'Dibatalkan', 'st.expired':'Kedaluwarsa', 'st.invoice':'Faktur',
    'rep.rev':'Total Pendapatan', 'rep.from_bookings':'dari pemesanan', 'rep.confirmed':'Terkonfirmasi', 'rep.bookings':'pemesanan', 'rep.awaiting':'Menunggu Pembayaran', 'rep.need_follow':'perlu ditindaklanjuti', 'rep.quotations':'Penawaran', 'rep.cancelled_exp':'dibatalkan/kedaluwarsa',
    'inv.max':'Maks', 'inv.guests':'tamu', 'inv.night':'malam', 'inv.edit':'Ubah', 'inv.delete':'Hapus', 'inv.add_room':'Tambah Kamar',
    'cal.jan':'Januari', 'cal.feb':'Februari', 'cal.mar':'Maret', 'cal.apr':'April', 'cal.may':'Mei', 'cal.jun':'Juni', 'cal.jul':'Juli', 'cal.aug':'Agustus', 'cal.sep':'September', 'cal.oct':'Oktober', 'cal.nov':'November', 'cal.dec':'Desember',
    'cal.su':'Mg', 'cal.mo':'Sn', 'cal.tu':'Sl', 'cal.we':'Rb', 'cal.th':'Km', 'cal.fr':'Jm', 'cal.sa':'Sb',
    'btn.preview': 'Pratinjau', 'btn.view': 'Lihat'
  `;

  langStr = langStr.replace(/('fs\.total':'Total',?[\n\s]*)\},/, `$1    ${enAdds}\n  },`);
  langStr = langStr.replace(/('fs\.total':'Total',?[\n\s]*)\}\n\};/, `$1    ${idAdds}\n  }\n};`);
  
  clientCode = clientCode.replace(langMatches[0], langStr);
}

// Manual replacements to avoid regex parsing issues
clientCode = clientCode.replace(
  "['January','February','March','April','May','June','July','August','September','October','November','December']",
  "[t('cal.jan'),t('cal.feb'),t('cal.mar'),t('cal.apr'),t('cal.may'),t('cal.jun'),t('cal.jul'),t('cal.aug'),t('cal.sep'),t('cal.oct'),t('cal.nov'),t('cal.dec')]"
);

clientCode = clientCode.replace(
  "['Su','Mo','Tu','We','Th','Fr','Sa']",
  "[t('cal.su'),t('cal.mo'),t('cal.tu'),t('cal.we'),t('cal.th'),t('cal.fr'),t('cal.sa')]"
);

clientCode = clientCode.replace(
  "const l = { confirmed:'Confirmed', awaiting:'Awaiting Payment', quotation:'Quotation', cancelled:'Cancelled', expired:'Expired' };",
  "const l = { confirmed:t('st.confirmed'), awaiting:t('st.awaiting'), quotation:t('st.quotation'), cancelled:t('st.cancelled'), expired:t('st.expired') };"
);

clientCode = clientCode.replace(
  "return t === 'quotation' ? `<span class=\"badge badge-quotation\">Quotation</span>` : `<span class=\"badge badge-invoice\">Invoice</span>`;",
  "return t === 'quotation' ? `<span class=\"badge badge-quotation\">${t('st.quotation')}</span>` : `<span class=\"badge badge-invoice\">${t('st.invoice')}</span>`;"
);

clientCode = clientCode.replace(
  "No bookings found.",
  "${t('lbl.no_bookings')}"
);

clientCode = clientCode.replace(
  "No documents found.",
  "${t('lbl.no_documents')}"
);

// We need to use split and join or careful replace for multiple instances
clientCode = clientCode.split("${n} night${n===1?'':'s'}").join("${n} ${n===1?t('lbl.night'):t('lbl.nights')}");

clientCode = clientCode.replace(
  "<div class=\"stat-card-label\">Total Revenue</div><div class=\"stat-card-value\">${idr(bRev)}</div><div class=\"stat-card-sub green\">from bookings</div>",
  "<div class=\"stat-card-label\">${t('rep.rev')}</div><div class=\"stat-card-value\">${idr(bRev)}</div><div class=\"stat-card-sub green\">${t('rep.from_bookings')}</div>"
);

clientCode = clientCode.replace(
  "<div class=\"stat-card-label\">Confirmed</div><div class=\"stat-card-value\">${confirmed.length}</div><div class=\"stat-card-sub\">bookings</div>",
  "<div class=\"stat-card-label\">${t('rep.confirmed')}</div><div class=\"stat-card-value\">${confirmed.length}</div><div class=\"stat-card-sub\">${t('rep.bookings')}</div>"
);

clientCode = clientCode.replace(
  "<div class=\"stat-card-label\">Awaiting Payment</div><div class=\"stat-card-value\">${awaiting.length}</div><div class=\"stat-card-sub\">need follow-up</div>",
  "<div class=\"stat-card-label\">${t('rep.awaiting')}</div><div class=\"stat-card-value\">${awaiting.length}</div><div class=\"stat-card-sub\">${t('rep.need_follow')}</div>"
);

clientCode = clientCode.replace(
  "<div class=\"stat-card-label\">Quotations</div><div class=\"stat-card-value\">${quotations.length}</div><div class=\"stat-card-sub\">${cancelled.length} cancelled/expired</div>",
  "<div class=\"stat-card-label\">${t('rep.quotations')}</div><div class=\"stat-card-value\">${quotations.length}</div><div class=\"stat-card-sub\">${cancelled.length} ${t('rep.cancelled_exp')}</div>"
);

clientCode = clientCode.replace(
  "<span>Quotations value: <strong>${idr(qVal)}</strong></span><span>Bookings revenue: <strong>${idr(bRev)}</strong></span><span class=\"grand\">Grand Total: ${idr(qVal + bRev)}</span>",
  "<span>${t('rep.quotations')} value: <strong>${idr(qVal)}</strong></span><span>${t('rep.bookings')} revenue: <strong>${idr(bRev)}</strong></span><span class=\"grand\">Grand Total: ${idr(qVal + bRev)}</span>"
);

clientCode = clientCode.split("Max ${r.capacity} guests · ${idr(r.rate)}/night").join("${t('inv.max')} ${r.capacity} ${t('inv.guests')} &middot; ${idr(r.rate)}/${t('inv.night')}");

clientCode = clientCode.split(">Edit</button>").join(">${t('inv.edit')}</button>");
clientCode = clientCode.split(">Delete</button>").join(">${t('inv.delete')}</button>");

const langReplacement = `function setLanguage(lang) {
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
}`;

clientCode = clientCode.replace(/function setLanguage\(lang\) \{[\s\S]*?\}\);[\s\n]*\}/m, langReplacement);

// Mobile search fix
clientCode = clientCode.replace("dDesk.classList.remove('hidden'); dMob.classList.remove('hidden');", "dDesk.classList.remove('hidden'); dMob.classList.add('hidden'); // disable mobile dropdown");

fs.writeFileSync('public/client.js', clientCode);
