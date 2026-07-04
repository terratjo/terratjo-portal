const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(
  "db.execute('SELECT * FROM bookings ORDER BY checkin DESC')",
  "db.execute('SELECT * FROM bookings ORDER BY created_at DESC')"
);

fs.writeFileSync('server.js', server);
