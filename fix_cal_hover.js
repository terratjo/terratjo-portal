const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

css = css.replace('.day-cell:hover{background:#fafafa;}', '.day-cell:hover{background:var(--primary-light);}');
css = css.replace('.day-cell:hover{background:#f9f9f9;}', '.day-cell:hover{background:var(--primary-light);}');

fs.writeFileSync('public/style.css', css);
