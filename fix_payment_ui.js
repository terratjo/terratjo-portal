const fs = require('fs');

// 1. UPDATE index.html
let html = fs.readFileSync('public/index.html', 'utf8');

const oldFooter = `<div class="modal-footer" style="justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
        </div>`;

const newFooter = `<div class="modal-footer" style="display:flex; justify-content: center; gap: 12px; margin-top:20px;">
            <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
        </div>`;

html = html.replace(oldFooter, newFooter);
fs.writeFileSync('public/index.html', html);

// 2. UPDATE style.css
let css = fs.readFileSync('public/style.css', 'utf8');
const mobileOverride = `
@media (max-width: 1000px) {
  #payment-modal.modal-overlay {
    align-items: center !important;
    padding: 20px !important;
  }
  #payment-modal .modal {
    border-radius: var(--radius-xl) !important;
    margin-bottom: 0 !important;
    max-height: 90vh !important;
  }
}
`;
css += mobileOverride;
fs.writeFileSync('public/style.css', css);
