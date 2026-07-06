const url = 'https://script.google.com/macros/s/AKfycbzhAosQLQHLKDfVd2ZgDRp-P-fyz-uijlqJuM6BzJT-Ul-xVzSX-Z_9cBa4mzl-M19pLA/exec';
const payload = {
  action: 'confirmed',
  id: 'TJ-052891',
  guestName: 'samoht test mac',
  checkin: '05/07/2026',
  total: 757000,
  paymentProofBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  redirect: 'manual'
})
.then(async res => {
  console.log('Status:', res.status);
  console.log('Location:', res.headers.get('location'));
  const text = await res.text();
  console.log('Body:', text.substring(0, 300));
  
  if (res.status === 302) {
    console.log('Following redirect manually...');
    const res2 = await fetch(res.headers.get('location'));
    const text2 = await res2.text();
    console.log('Redirect Response:', text2.substring(0, 500));
  }
})
.catch(err => console.error('Error:', err));
