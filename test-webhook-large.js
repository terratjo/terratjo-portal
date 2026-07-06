const url = 'https://script.google.com/macros/s/AKfycbxDYikl_WDSKKqgTkdQ9-I4smcR2hyqcCEYwaSbHTDC184wLNiqyGlnv-7RHchxOIa23A/exec';

// Create a 6MB base64 string
const largeString = 'data:image/jpeg;base64,' + 'A'.repeat(6 * 1024 * 1024);

const payload = {
  action: 'confirmed',
  id: 'TJ-LARGE',
  guestName: 'LARGE TEST',
  total: 1000,
  paymentProofBase64: largeString
};

console.log('Sending payload of size:', JSON.stringify(payload).length / 1024 / 1024, 'MB');

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 300));
})
.catch(err => console.error('Error:', err));
