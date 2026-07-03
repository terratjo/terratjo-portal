const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('public/style.css', 'utf8');

css = css.replace('.sr-title { \n    grid-column: 1 / -1;', '.sr-title { \n    grid-column: 1;');
css = css.replace('.sr-title { \n    grid-column: 1;', `.sr-room {
    grid-column: 2;
    grid-row: 1;
    font-size: 11.5px;
    color: var(--text-mid);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-weight: 500;
}
.sr-title { 
    grid-column: 1;`);

fs.writeFileSync('public/style.css', css);

// 2. Update client.js
let js = fs.readFileSync('public/client.js', 'utf8');

js = js.replace(
  '<div class="sr-sub"><i data-lucide="user" style="width:12px;height:12px;"></i> ${b.guestName||\'No Name\'} &nbsp;&bull;&nbsp; ${getRoomName(b.room)}</div>',
  '<div class="sr-room"><span style="opacity:0.5; margin-right:4px;">&bull;</span> ${getRoomName(b.room)}</div>\n        <div class="sr-sub"><i data-lucide="user" style="width:12px;height:12px;"></i> ${b.guestName||\'No Name\'}</div>'
);

fs.writeFileSync('public/client.js', js);
