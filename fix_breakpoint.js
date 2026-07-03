const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('public/style.css', 'utf8');

// Remove the IPAD PORTRAIT FIXES block entirely
css = css.replace(/\/\* ── IPAD PORTRAIT FIXES \[\s\S\]*?\}\n\}\n/g, ''); // Wait, I will just split by this comment since it's at the very end of the file.

const parts = css.split('/* ── IPAD PORTRAIT FIXES');
if(parts.length > 1) {
    css = parts[0];
}

// Replace all 768px breakpoints with 1000px
css = css.replace(/max-width:768px/g, 'max-width:1000px');
css = css.replace(/max-width: 768px/g, 'max-width: 1000px');
css = css.replace(/≤ 768px/g, '≤ 1000px');
fs.writeFileSync('public/style.css', css);

// 2. Update client.js
let js = fs.readFileSync('public/client.js', 'utf8');
js = js.replace(/window\.innerWidth\s*<=\s*768/g, 'window.innerWidth <= 1000');
fs.writeFileSync('public/client.js', js);
