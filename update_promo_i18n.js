const fs = require('fs');

let js = fs.readFileSync('public/client.js', 'utf8');

// 1. Add keys to LANG
const langMatches = js.match(/const LANG = \{([\s\S]*?)\n\};/);
if (langMatches) {
  let langStr = langMatches[0];

  const enAdds = `
    'th.discount':'DISCOUNT', 'th.period':'PERIOD',
    'promo.ongoing':'Ongoing', 'promo.scheduled':'Scheduled', 'promo.inactive':'Inactive', 'promo.all_rooms':'All Rooms'
  `;

  const idAdds = `
    'th.discount':'DISKON', 'th.period':'PERIODE',
    'promo.ongoing':'Berlangsung', 'promo.scheduled':'Dijadwalkan', 'promo.inactive':'Tidak Aktif', 'promo.all_rooms':'Semua Kamar'
  `;

  langStr = langStr.replace(/('set\.inv_prev':'Invoice Header Preview'[\n\s]*)\},/, `$1,    ${enAdds}\n  },`);
  langStr = langStr.replace(/('set\.inv_prev':'Pratinjau Kop Faktur'[\n\s]*)\}\n\};/, `$1,    ${idAdds}\n  }\n};`);

  js = js.replace(langMatches[0], langStr);
}

// 2. Update renderPromos
js = js.replace(/const cfg = \{ ongoing:\{cls:'promo-badge-ongoing',lbl:'🟢 Ongoing'\}, scheduled:\{cls:'promo-badge-scheduled',lbl:'🔵 Scheduled'\}, inactive:\{cls:'promo-badge-inactive',lbl:'⚫ Inactive'\} \}\[s\] \|\| \{cls:'',lbl:s\};/, `const cfg = { ongoing:{cls:'promo-badge-ongoing',lbl:'🟢 '+t('promo.ongoing')}, scheduled:{cls:'promo-badge-scheduled',lbl:'🔵 '+t('promo.scheduled')}, inactive:{cls:'promo-badge-inactive',lbl:'⚫ '+t('promo.inactive')} }[s] || {cls:'',lbl:s};`);

js = js.replace(`<thead><tr><th>Description</th><th>Room</th><th>Discount</th><th>Period</th><th>Status</th><th></th></tr></thead>`, `<thead><tr><th>\${t('th.desc')}</th><th>\${t('th.room')}</th><th>\${t('th.discount')}</th><th>\${t('th.period')}</th><th>\${t('th.status')}</th><th></th></tr></thead>`);

js = js.replace(/const room = p\.roomId === 'all' \? 'All Rooms' : getRoomName\(p\.roomId\);/, `const room = p.roomId === 'all' ? t('promo.all_rooms') : getRoomName(p.roomId);`);

js = js.replace(`<button class="btn btn-danger btn-sm" onclick="deletePromo('\${p.id}')">Del</button>`, `<button class="btn btn-danger btn-sm" onclick="deletePromo('\${p.id}')">\${t('inv.delete')}</button>`);

// Also fix promo form labels in index.html (Wait, promo form is in index.html, not client.js!)
fs.writeFileSync('public/client.js', js);

// 3. Check index.html for promo form
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace('<label>PROMO DESCRIPTION</label>', '<label data-i18n="promo.lbl_desc">PROMO DESCRIPTION</label>');
html = html.replace('<label>DISCOUNT TYPE</label>', '<label data-i18n="promo.lbl_type">DISCOUNT TYPE</label>');
html = html.replace('<label id="promo-value-label">DISCOUNT (%)</label>', '<label id="promo-value-label" data-i18n="promo.lbl_val">DISCOUNT (%)</label>'); // wait, promo-value-label textContent is changed by JS.
html = html.replace('<label>APPLY TO ROOM</label>', '<label data-i18n="promo.lbl_room">APPLY TO ROOM</label>');
html = html.replace('<label>START DATE</label>', '<label data-i18n="promo.lbl_start">START DATE</label>');
html = html.replace('<label>END DATE</label>', '<label data-i18n="promo.lbl_end">END DATE</label>');

html = html.replace('<button type="button" class="promo-type-btn active" data-type="percentage">Percentage (%)</button>', '<button type="button" class="promo-type-btn active" data-type="percentage" data-i18n="promo.type_perc">Percentage (%)</button>');
html = html.replace('<button type="button" class="promo-type-btn" data-type="fixed">Fixed Amount (Rp)</button>', '<button type="button" class="promo-type-btn" data-type="fixed" data-i18n="promo.type_fixed">Fixed Amount (Rp)</button>');

fs.writeFileSync('public/index.html', html);
