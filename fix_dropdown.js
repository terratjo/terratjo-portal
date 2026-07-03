const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('public/style.css', 'utf8');

css = css.replace('.search-result-item { padding:12px 16px; border-bottom:1px solid #f0f0f0; cursor:pointer; transition:background .2s; text-align:left; }', 
`.search-result-item { 
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    column-gap: 8px;
    row-gap: 4px;
    padding: 12px 16px; 
    border-bottom: 1px solid #f0f0f0; 
    cursor: pointer; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
    text-align: left; 
}`);

css = css.replace('.search-result-item:hover { background:var(--primary-light); }', 
`.search-result-item:hover { 
    background: var(--primary-light); 
    transform: translateX(4px);
    border-bottom-color: transparent;
}`);

css = css.replace('.sr-title { font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; }', 
`.sr-title { 
    grid-column: 1 / -1;
    grid-row: 1;
    font-size:13.5px; 
    font-weight:700; 
    color:var(--text-dark); 
    margin-bottom:2px;
}`);

css = css.replace('.sr-sub { font-size:11.5px; color:var(--text-mid); display:flex; align-items:center; gap:6px; }',
`.sr-sub { 
    grid-column: 1;
    grid-row: 2;
    font-size:11.5px; 
    color:var(--text-mid); 
    display:flex; 
    align-items:center; 
    gap:6px; 
}
.sr-badge {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    align-items: flex-end;
}`);

css = css.replace('.sr-title .badge { font-size:10px; padding:2px 6px; border-radius:8px; font-weight:700; text-transform:uppercase; }', '.sr-badge .badge { font-size:10px; padding:2px 6px; border-radius:8px; font-weight:700; text-transform:uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }');
css = css.replace('.sr-title .badge.quotation', '.sr-badge .badge.quotation');
css = css.replace('.sr-title .badge.invoice', '.sr-badge .badge.invoice');
css = css.replace('.sr-title .badge.cancelled', '.sr-badge .badge.cancelled');

fs.writeFileSync('public/style.css', css);

// 2. Update client.js
let js = fs.readFileSync('public/client.js', 'utf8');
js = js.replace(
  '<div class="sr-title"><span>${b.id}</span> <span class="badge ${badgeCls}">${st}</span></div>',
  '<div class="sr-title"><span>${b.id}</span></div>'
);
js = js.replace(
  '<div class="sr-sub"><i data-lucide="user" style="width:12px;height:12px;"></i> ${b.guestName||\'No Name\'} &nbsp;&bull;&nbsp; ${getRoomName(b.room)}</div>',
  '<div class="sr-sub"><i data-lucide="user" style="width:12px;height:12px;"></i> ${b.guestName||\'No Name\'} &nbsp;&bull;&nbsp; ${getRoomName(b.room)}</div>\n        <div class="sr-badge"><span class="badge ${badgeCls}">${st}</span></div>'
);

fs.writeFileSync('public/client.js', js);
