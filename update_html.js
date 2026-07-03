const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

html = html.replace('<th>#</th><th>GUEST</th><th>ROOM</th>', '<th>#</th><th data-i18n="th.guest">GUEST</th><th data-i18n="th.room">ROOM</th>');
html = html.replace('<th>CHECK-IN</th><th>CHECK-OUT</th><th>NIGHTS</th>', '<th data-i18n="th.checkin">CHECK-IN</th><th data-i18n="th.checkout">CHECK-OUT</th><th data-i18n="th.nights">NIGHTS</th>');
html = html.replace('<th>TOTAL</th><th>STATUS</th>', '<th data-i18n="th.total">TOTAL</th><th data-i18n="th.status">STATUS</th>');

html = html.replace('<th>#</th><th>GUEST</th><th>DATES</th><th>NIGHTS</th>', '<th>#</th><th data-i18n="th.guest">GUEST</th><th data-i18n="th.dates">DATES</th><th data-i18n="th.nights">NIGHTS</th>');
html = html.replace('<th>TOTAL</th><th>TYPE</th><th>STATUS</th>', '<th data-i18n="th.total">TOTAL</th><th data-i18n="th.type">TYPE</th><th data-i18n="th.status">STATUS</th>');

html = html.replace('<th>#</th><th>GUEST</th><th>TYPE</th><th>ROOM</th>', '<th>#</th><th data-i18n="th.guest">GUEST</th><th data-i18n="th.type">TYPE</th><th data-i18n="th.room">ROOM</th>');
html = html.replace('<th>RATE/NIGHT</th><th>TOTAL</th><th>STATUS</th>', '<th data-i18n="th.rate">RATE/NIGHT</th><th data-i18n="th.total">TOTAL</th><th data-i18n="th.status">STATUS</th>');

html = html.replace('<th>Description</th><th>Quantity</th><th>Rate</th><th>Amount</th>', '<th data-i18n="th.desc">Description</th><th data-i18n="th.qty">Quantity</th><th data-i18n="th.rate">Rate</th><th data-i18n="th.amount">Amount</th>');

fs.writeFileSync('public/index.html', html);
