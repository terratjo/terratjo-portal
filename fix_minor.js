const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('public/style.css', 'utf8');

// Disable hover on past days
css = css.replace('.day-cell:hover{background:var(--primary-light);}', '.day-cell:hover{background:var(--primary-light);}\n.day-cell.past { cursor: default; }\n.day-cell.past:hover { background: transparent; }');

// Mobile font size adjustments for dropdown
const mobileCSS = `
    .search-result-item { padding: 10px 12px; }
    .sr-title { font-size: 12.5px; white-space: nowrap; }
    .sr-room { font-size: 10.5px; }
    .sr-sub { font-size: 10.5px; }
`;
css = css.replace('/* ── SEARCH (Mobile) ────────────────────────────────── */', '/* ── SEARCH (Mobile) ────────────────────────────────── */' + mobileCSS);

fs.writeFileSync('public/style.css', css);

// 2. Update client.js
let js = fs.readFileSync('public/client.js', 'utf8');

js = js.replace(
  'grid.innerHTML += `<div class="day-cell"><div class="day-number inactive">${prevDim - i}</div></div>`;',
  'grid.innerHTML += `<div class="day-cell past"><div class="day-number inactive">${prevDim - i}</div></div>`;'
);

js = js.replace(
  "grid.innerHTML += `<div class=\"day-cell\" data-date=\"${ds}\"><div class=\"day-number ${cls}\">${d}</div>${blks}</div>`;",
  "const isPast = ds < todayStr; grid.innerHTML += `<div class=\"day-cell ${isPast ? 'past' : ''}\" data-date=\"${ds}\"><div class=\"day-number ${cls}\">${d}</div>${blks}</div>`;"
);

js = js.replace(
  'grid.innerHTML += `<div class="day-cell"><div class="day-number inactive">${i}</div></div>`;',
  'grid.innerHTML += `<div class="day-cell past"><div class="day-number inactive">${i}</div></div>`;' // next month is in future technically, but they are inactive so we can just add 'past' class to disable hover, or maybe call it 'inactive-cell'. The user said "date yesterday or the date before today", so future blank cells shouldn't be 'past'. Let's use 'past' for all inactive cells anyway because they are unclickable.
);

fs.writeFileSync('public/client.js', js);
