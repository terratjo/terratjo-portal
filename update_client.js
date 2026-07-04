const fs = require('fs');
let js = fs.readFileSync('public/client.js', 'utf8');

const modalLogic = `
  $('payment-booking-id').value = b.id;
  $('payment-method').value = 'Transfer BCA';
  $('payment-proof-file').value = '';
  $('payment-modal').classList.add('active');
`;
js = js.replace("if (!confirm('Mark this quotation as paid and convert to Invoice?')) return;", modalLogic);
js = js.replace("try {\n    await api.put(`/bookings/${b.id}`, { ...b, type:'invoice', status:'confirmed' });\n    showToast('Converted to Invoice ✓');\n    await loadData(); openIPM(b.id); refreshCurrentPage();\n  } catch(e) { showToast('Conversion failed: ' + e.message); }", "");

const newListeners = `
$('btn-close-payment-modal')?.addEventListener('click', () => $('payment-modal').classList.remove('active'));
$('btn-cancel-payment')?.addEventListener('click', () => $('payment-modal').classList.remove('active'));

$('btn-confirm-payment')?.addEventListener('click', async () => {
  const bId = $('payment-booking-id').value;
  const b = app.bookings.find(x => x.id === bId); if (!b) return;
  const paymentMethod = $('payment-method').value;
  const fileInput = $('payment-proof-file');
  let paymentProofBase64 = null;

  const confirmBtn = $('btn-confirm-payment');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  try {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      paymentProofBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
      });
    }

    await api.put(\`/bookings/\${b.id}\`, { ...b, type:'invoice', status:'confirmed', paymentMethod, paymentProofBase64 });
    showToast('Converted to Invoice ✓');
    $('payment-modal').classList.remove('active');
    await loadData(); openIPM(b.id); refreshCurrentPage();
  } catch(e) { 
    showToast('Conversion failed: ' + e.message); 
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm as Paid';
  }
});
`;

js = js + '\n' + newListeners;

const ipmPaymentDisplay = `
  if (b.paymentMethod) {
    $('ipm-payment-method').textContent = 'Payment Method: ' + b.paymentMethod;
    $('ipm-payment-method').style.display = 'block';
  } else {
    $('ipm-payment-method').style.display = 'none';
  }
`;
js = js.replace("if(b.type==='quotation'){", ipmPaymentDisplay + "\n  if(b.type==='quotation'){");

fs.writeFileSync('public/client.js', js);
