const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace('family=Playfair+Display:wght@600;700&', '');
html = html.replace(/'Playfair Display',serif/g, "'CustomFont', sans-serif");
fs.writeFileSync('public/index.html', html);

// 2. Update style.css
let css = fs.readFileSync('public/style.css', 'utf8');
const fontFace = `
@font-face {
    font-family: 'CustomFont';
    src: url('fonts/AirbnbCereal_W_Bd.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}
`;
css = fontFace + css.replace(/'Playfair Display',serif/g, "'CustomFont', sans-serif");
fs.writeFileSync('public/style.css', css);
