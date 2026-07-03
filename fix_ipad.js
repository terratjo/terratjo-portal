const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

const ipadCSS = `
/* ── IPAD PORTRAIT FIXES (769px - 1100px) ────────────────────────────────── */
@media (min-width: 769px) and (max-width: 1100px) {
    .top-bar {
        height: auto;
        min-height: 62px;
        padding: 16px 24px;
        flex-wrap: wrap;
        gap: 16px;
    }
    .top-bar-left {
        width: 100%;
        justify-content: flex-start;
    }
    .top-bar-right {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }
    .page-title {
        white-space: nowrap;
        font-size: 18px;
    }
    .location-badge {
        white-space: nowrap;
    }
    /* Allow calendar to scroll internally if screen is too short */
    .calendar-container {
        height: calc(100vh - 140px);
        min-height: 600px;
    }
}
`;

fs.appendFileSync('public/style.css', ipadCSS);
