const fs = require('fs');

// 1. UPDATE index.html
let html = fs.readFileSync('public/index.html', 'utf8');

const oldInput = `<label>Payment Proof (Optional)</label>
                <input type="file" id="payment-proof-file" accept="image/*,application/pdf">`;

const newInput = `<label style="text-transform:uppercase;">Payment Proof (Optional)</label>
                <div class="file-drop-area" id="payment-drop-area">
                    <i data-lucide="folder"></i>
                    <p>Drag & drop a file or <span>browse</span></p>
                    <small>Max file size is 20 MB</small>
                    <input type="file" id="payment-proof-file" accept="image/*,application/pdf" class="file-input-hidden">
                </div>`;
html = html.replace(oldInput, newInput);

const oldLabel = `<label>Payment Method</label>`;
html = html.replace(oldLabel, `<label style="text-transform:uppercase;">Payment Method</label>`);

const oldFooter = `<div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
        </div>`;
const newFooter = `<div class="modal-footer" style="justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
        </div>`;
html = html.replace(oldFooter, newFooter);

fs.writeFileSync('public/index.html', html);

// 2. UPDATE style.css
let css = fs.readFileSync('public/style.css', 'utf8');
const newCss = `
/* ── PAYMENT PROOF FILE DROP ────────────────────────────── */
#payment-modal {
    z-index: 1050; /* Ensure it is above ipm-modal (z-index 1000) */
}
.file-drop-area {
    position: relative;
    background: var(--primary);
    border: 1.5px dashed rgba(0,0,0,0.25);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-dark);
    margin-top: 4px;
}
.file-drop-area:hover {
    background: #eabd1e; /* darker yellow on hover */
    border-color: rgba(0,0,0,0.4);
}
.file-drop-area svg.lucide {
    width: 24px;
    height: 24px;
    margin-bottom: 8px;
    opacity: 0.85;
}
.file-drop-area p {
    font-size: 15px;
    font-weight: 500;
    margin: 0 0 6px 0;
}
.file-drop-area p span {
    text-decoration: underline;
}
.file-drop-area small {
    font-size: 12px;
    opacity: 0.75;
}
.file-input-hidden {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}
`;
css += newCss;
fs.writeFileSync('public/style.css', css);

// 3. UPDATE client.js
let js = fs.readFileSync('public/client.js', 'utf8');

const oldModalReset = `$('payment-booking-id').value = b.id;
  $('payment-method').value = 'Transfer BCA';
  $('payment-proof-file').value = '';
  $('payment-modal').classList.add('active');`;

const newModalReset = `$('payment-booking-id').value = b.id;
  $('payment-method').value = 'Transfer BCA';
  $('payment-proof-file').value = '';
  const p = $('payment-drop-area').querySelector('p');
  p.innerHTML = \`Drag & drop a file or <span>browse</span>\`;
  $('payment-modal').classList.add('active');`;

js = js.replace(oldModalReset, newModalReset);

const fileListener = `
$('payment-proof-file')?.addEventListener('change', function() {
  const p = $('payment-drop-area').querySelector('p');
  if (this.files && this.files.length > 0) {
      p.innerHTML = \`Selected: <b>\${this.files[0].name}</b>\`;
  } else {
      p.innerHTML = \`Drag & drop a file or <span>browse</span>\`;
  }
});
`;
js = js + '\n' + fileListener;

fs.writeFileSync('public/client.js', js);
