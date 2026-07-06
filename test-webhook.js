const url = 'https://script.google.com/macros/s/AKfycbwfjqUAL9qSAMnE9WcceRpI_GgmrIy_H6QdlsvIpACaBDnRpL7okNZN0BB65mcbFMG9iQ/exec';
const payload = {
  action: 'confirmed',
  id: 'TJ-TEST',
  guestName: 'Webhook Test',
  checkin: '01/01/2026',
  total: 1000
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
