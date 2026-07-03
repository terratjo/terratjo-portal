const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('public/style.css', 'utf8');

// Table hover colors
css = css.replace('.data-table tbody tr:hover{background:#fafafa;}', '.data-table tbody tr:hover{background:var(--primary-light);}');
css = css.replace('.promo-table tbody tr:hover { background:#fafafa; }', '.promo-table tbody tr:hover { background:var(--primary-light); }');
// Also update search result hover just in case they want it consistent (optional, but good)
css = css.replace('.search-result-item:hover { background:#fafafa; }', '.search-result-item:hover { background:var(--primary-light); }');

// Add search input styles
const searchStyles = `
/* Search Input Custom Styles */
#desktop-search-input {
    border: 1.5px solid var(--border) !important;
    outline: none !important;
    transition: all 0.2s ease;
}
#mobile-search-input {
    border: 1.5px solid transparent !important;
    outline: none !important;
    transition: all 0.2s ease;
}
#desktop-search-input:hover, #desktop-search-input:focus,
#mobile-search-input:hover, #mobile-search-input:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(255,200,35,.14) !important;
}
`;

css += '\n' + searchStyles;

fs.writeFileSync('public/style.css', css);

// 2. Update index.html inline styles for search inputs to prevent jumps
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace('border:1px solid var(--border);', 'border:1.5px solid var(--border);');
fs.writeFileSync('public/index.html', html);

