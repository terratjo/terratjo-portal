const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Insert Payment Modal
const paymentModal = `
<!-- Payment Modal -->
<div class="modal-overlay" id="payment-modal">
    <div class="modal form-modal">
        <div class="modal-header">
            <h3>Confirm Payment</h3>
            <button class="btn-icon" id="btn-close-payment-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
            <input type="hidden" id="payment-booking-id">
            <div class="form-group">
                <label>Payment Method</label>
                <select id="payment-method">
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Cash">Cash</option>
                </select>
            </div>
            <div class="form-group">
                <label>Payment Proof (Optional)</label>
                <input type="file" id="payment-proof-file" accept="image/*,application/pdf">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
        </div>
    </div>
</div>

<!-- Promo Modal -->`;
html = html.replace('<!-- Promo Modal -->', paymentModal);

// Insert Payment Method into Invoice
html = html.replace('<small id="ipm-doc-date">Date: —</small>', '<small id="ipm-doc-date">Date: —</small>\n                        <small id="ipm-payment-method" style="display:none; margin-top:2px; font-weight:600; color:var(--primary);">Payment: —</small>');

fs.writeFileSync('public/index.html', html);
