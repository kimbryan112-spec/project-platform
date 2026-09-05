const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Lumilikha ito ng local database.sqlite file sa iyong PC
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to local SQLite database successfully.');
  }
});

// Halimbawa ng table creation kung wala pa
db.run(`CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Endpoint para makuha ang data
app.get('/api/data', (req, res) => {
  db.all("SELECT * FROM items", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ rows });
  });
});

// Endpoint para mag-save ng bagong data
app.post('/api/data', (req, res) => {
  const { name } = req.body;
  db.run(`INSERT INTO items (name) VALUES (?)`, [name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name });
  });
});

// Patakbuhin ang server sa port 3000
app.listen(3000, () => {
  console.log('Local server is running on http://localhost:3000');
});