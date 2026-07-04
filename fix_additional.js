const fs = require('fs');

// 1. UPDATE client.js
let js = fs.readFileSync('public/client.js', 'utf8');

// Add translation keys
js = js.replace("'fs.cleaning':'Cleaning fee',", "'fs.cleaning':'Cleaning fee','fs.additional':'Additional fee',");
js = js.replace("'fs.cleaning':'Biaya kebersihan',", "'fs.cleaning':'Biaya kebersihan','fs.additional':'Biaya tambahan',");

// Update calcFormSummary
const oldCalc = `const ci = $('form-checkin').value, co = $('form-checkout').value;
  const rate = +$('form-price').value||0, cleaning = +$('form-cleaning').value||0, deposit = +$('form-deposit').value||0, taxPct = +$('form-tax').value||0;
  const n = (ci && co) ? nightsCount(ci, co) : 1;
  const acc = n * rate, taxAmt = Math.round((acc + cleaning) * taxPct / 100);
  const promoId = $('form-promo')?.value;
  const promo = promoId ? app.promos.find(p => p.id === promoId) : null;
  const discAmt = calcPromoDiscount(promo, acc);
  const total = acc + cleaning + deposit + taxAmt - discAmt;
  $('fs-rate').textContent = idr(rate); $('fs-nights-label').textContent = n + ' night' + (n>1?'s':''); $('fs-nights-count').textContent = n;
  $('fs-accommodation').textContent = idr(acc); $('fs-cleaning').textContent = cleaning>0?idr(cleaning):'—';
  $('fs-deposit').textContent = deposit>0?idr(deposit):'—'; $('fs-tax').textContent = taxPct>0?idr(taxAmt):'—';`;

const newCalc = `const ci = $('form-checkin').value, co = $('form-checkout').value;
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
  $('fs-deposit').textContent = deposit>0?idr(deposit):'—'; $('fs-tax').textContent = taxPct>0?idr(taxAmt):'—';`;

js = js.replace(oldCalc, newCalc);

// Add event listener for form-additional
js = js.replace("['form-checkin','form-checkout','form-price','form-cleaning','form-deposit','form-tax']", "['form-checkin','form-checkout','form-price','form-cleaning','form-deposit','form-tax','form-additional']");

fs.writeFileSync('public/client.js', js);

// 2. UPDATE index.html
let html = fs.readFileSync('public/index.html', 'utf8');

const additionalRow = `
                    <div class="form-summary-row"><span data-i18n="fs.cleaning">Cleaning fee</span><span id="fs-cleaning">—</span></div>
                    <div class="form-summary-row"><span data-i18n="fs.additional">Additional fee</span><span id="fs-additional">—</span></div>`;

html = html.replace('<div class="form-summary-row"><span data-i18n="fs.cleaning">Cleaning fee</span><span id="fs-cleaning">—</span></div>', additionalRow);

fs.writeFileSync('public/index.html', html);
