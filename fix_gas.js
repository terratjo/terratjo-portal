const fs = require('fs');
let gas = fs.readFileSync('google-apps-script.js', 'utf8');

gas = gas.replace(
  'const monthName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");',
  'const monthName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM").toUpperCase(); // e.g. "JULY"'
);

fs.writeFileSync('google-apps-script.js', gas);
