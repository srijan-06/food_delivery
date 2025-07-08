const jwt = require('jsonwebtoken');
const { connection } = require('../config/db');

function verifyAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    connection.query('SELECT role FROM users WHERE id=?', [decoded.id], (err, results) => {
      if (err || !results.length) return res.status(500).json({ error: 'User lookup failed' });

      if (results[0].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.user = decoded;
      next();
    });
  });
}

module.exports = verifyAdmin;
