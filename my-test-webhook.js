const url = 'https://script.google.com/macros/s/AKfycbxDYikl_WDSKKqgTkdQ9-I4smcR2hyqcCEYwaSbHTDC184wLNiqyGlnv-7RHchxOIa23A/exec';
const payload = {
  action: 'confirmed',
  id: 'TJ-112233',
  guestName: 'Webhook Test',
  room: 'r3',
  total: 555000,
  reservationDetails: 'Airbnb',
  paymentInfo: 'Transfer BCA'
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  redirect: 'follow'
})
.then(async res => {
  const text = await res.text();
  console.log('Response:', text);
})
.catch(err => console.error('Error:', err));
