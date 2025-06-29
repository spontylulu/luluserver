// 📄 memoria/db.js
// Gestione del database SQLite su Render (temporaneo fino a sync con ROG)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Assicura che la cartella 'memoria' esista
const memoriaDir = path.join(__dirname);
if (!fs.existsSync(memoriaDir)) {
  fs.mkdirSync(memoriaDir, { recursive: true });
}

// Percorso del DB
const dbPath = path.join(memoriaDir, 'messages.db');
const db = new sqlite3.Database(dbPath);

// Crea la tabella se non esiste
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pending_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      message TEXT NOT NULL
    )
  `);
});

// Inserisce un nuovo messaggio pendente
function salvaMessaggio(chatId, message) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString();
    const sql = `INSERT INTO pending_messages (timestamp, chat_id, message) VALUES (?, ?, ?)`;
    db.run(sql, [timestamp, chatId, JSON.stringify(message)], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

// Recupera tutti i messaggi pendenti
function getMessaggiPendenti() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM pending_messages ORDER BY timestamp ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Elimina un messaggio dopo sync
function eliminaMessaggio(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM pending_messages WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

module.exports = {
  salvaMessaggio,
  getMessaggiPendenti,
  eliminaMessaggio
};
