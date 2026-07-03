const fs = require('fs');

let js = fs.readFileSync('public/client.js', 'utf8');

const langMatches = js.match(/const LANG = \{([\s\S]*?)\n\};/);
if (langMatches) {
  let langStr = langMatches[0];

  const enAdds = `
    'promo.lbl_desc':'PROMO DESCRIPTION', 'promo.lbl_type':'DISCOUNT TYPE', 'promo.lbl_room':'APPLY TO ROOM', 'promo.lbl_start':'START DATE', 'promo.lbl_end':'END DATE',
    'promo.type_perc':'Percentage (%)', 'promo.type_fixed':'Fixed Amount (Rp)',
    'promo.val_perc':'DISCOUNT (%)', 'promo.val_fixed':'DISCOUNT AMOUNT (RP)'
  `;

  const idAdds = `
    'promo.lbl_desc':'DESKRIPSI PROMO', 'promo.lbl_type':'TIPE DISKON', 'promo.lbl_room':'TERAPKAN PADA KAMAR', 'promo.lbl_start':'TANGGAL MULAI', 'promo.lbl_end':'TANGGAL BERAKHIR',
    'promo.type_perc':'Persentase (%)', 'promo.type_fixed':'Nominal Tetap (Rp)',
    'promo.val_perc':'DISKON (%)', 'promo.val_fixed':'NOMINAL DISKON (RP)'
  `;

  langStr = langStr.replace(/('promo\.all_rooms':'All Rooms'[\n\s]*)\},/, `$1,    ${enAdds}\n  },`);
  langStr = langStr.replace(/('promo\.all_rooms':'Semua Kamar'[\n\s]*)\}\n\};/, `$1,    ${idAdds}\n  }\n};`);

  js = js.replace(langMatches[0], langStr);
}

// update the dynamic JS label updates
js = js.replace(/p\.type === 'percentage' \? 'DISCOUNT \(%\)' : 'DISCOUNT AMOUNT \(RP\)';/g, "p.type === 'percentage' ? t('promo.val_perc') : t('promo.val_fixed');");
js = js.replace(/type === 'percentage' \? 'DISCOUNT \(%\)' : 'DISCOUNT AMOUNT \(RP\)';/g, "type === 'percentage' ? t('promo.val_perc') : t('promo.val_fixed');");
js = js.replace(/\$\('promo-value-label'\)\.textContent = 'DISCOUNT \(%\)';/g, "$('promo-value-label').textContent = t('promo.val_perc');");

fs.writeFileSync('public/client.js', js);
