const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Target the payment proof form group and remove its margin-bottom
const oldProofGroup = `<div class="form-group">
                <label style="text-transform:uppercase;">Payment Proof (Optional)</label>`;
const newProofGroup = `<div class="form-group" style="margin-bottom: 0;">
                <label style="text-transform:uppercase;">Payment Proof (Optional)</label>`;
html = html.replace(oldProofGroup, newProofGroup);

// 2. Move modal-footer inside modal-body and adjust its margin
const oldFooterSection = `                </div>
            </div>
        </div>
        <div class="modal-footer" style="display:flex; justify-content: center; gap: 12px; margin-top:20px;">
            <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
        </div>
    </div>`;

const newFooterSection = `                </div>
            </div>
            <div class="modal-footer" style="display:flex; justify-content: center; gap: 12px; margin-top: 18px;">
                <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
                <button class="btn btn-primary" id="btn-confirm-payment">Confirm as Paid</button>
            </div>
        </div>
    </div>`;

html = html.replace(oldFooterSection, newFooterSection);
fs.writeFileSync('public/index.html', html);
