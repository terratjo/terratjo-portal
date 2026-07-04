const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace('<span class="subtitle">Booking Portal</span>', '<span class="subtitle" id="sidebar-tagline">Booking Portal</span>');
fs.writeFileSync('public/index.html', html);

// 2. Update client.js
let js = fs.readFileSync('public/client.js', 'utf8');
js = js.replace(
  /function updateTopBar\(\) \{[\s\S]*?\}/,
  `function updateTopBar() {
  if ($('tb-brand')) $('tb-brand').textContent = (app.settings.brand||'Terratjo') + ' ' + (app.settings.tagline||'Booking Portal');
  if ($('tb-loc')) $('tb-loc').textContent = app.settings.location||'';
  if ($('sidebar-brand-name')) $('sidebar-brand-name').textContent = app.settings.brand||'Terratjo Room';
  if ($('sidebar-tagline')) $('sidebar-tagline').textContent = app.settings.tagline||'Booking Portal';
}`
);
fs.writeFileSync('public/client.js', js);
