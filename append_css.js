const fs = require('fs');

const mobileCSS = `
@media(max-width: 768px) {
    .search-result-item { padding: 10px 12px; }
    .sr-title { font-size: 12.5px; white-space: nowrap; }
    .sr-room { font-size: 10.5px; }
    .sr-sub { font-size: 10.5px; }
}
`;

fs.appendFileSync('public/style.css', mobileCSS);
