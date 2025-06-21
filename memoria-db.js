// 📄 memoria-db.js
// Gestione della memoria persistente di Lulu (chat e progetti).
// Ogni chat viene salvata come un file SQLite nella cartella ./memoria/chat/
// Ogni progetto in ./memoria/progetto/<nome>/<sottochat>.db

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 📁 Percorsi base per i database
const BASE_DIR = path.join(__dirname, 'memoria');

function getDbPath(tipo, nome, sottochat = null) {
  if (tipo === 'chat') {
    return path.join(BASE_DIR, 'chat', `${nome}.db`);
  }
  if (tipo === 'progetto') {
    return path.join(BASE_DIR, 'progetto', nome, `${sottochat}.db`);
  }
  throw new Error(`Tipo non valido: ${tipo}`);
}

// ✅ Carica i messaggi da una chat o progetto
function loadMessages(tipo, nome, sottochat = null) {
  const dbPath = getDbPath(tipo, nome, sottochat);
  if (!fs.existsSync(dbPath)) return [];

  const db = new Database(dbPath);
  const rows = db.prepare('SELECT * FROM messaggi ORDER BY timestamp ASC').all();
  db.close();

  return rows.map(r => ({
    mittente: r.mittente,
    contenuto: r.contenuto,
    timestamp: r.timestamp,
  }));
}

// ✅ Aggiunge un messaggio a una chat o progetto
function appendMessage(tipo, nome, msg, sottochat = null) {
  const dbPath = getDbPath(tipo, nome, sottochat);

  // Crea la directory se non esiste
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.prepare(`
    CREATE TABLE IF NOT EXISTS messaggi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mittente TEXT,
      contenuto TEXT,
      timestamp TEXT
    )
  `).run();

  db.prepare(`
    INSERT INTO messaggi (mittente, contenuto, timestamp)
    VALUES (?, ?, ?)
  `).run(msg.mittente, msg.contenuto, msg.timestamp);

  db.close();
}

// ✅ Elenca tutte le chat o progetti disponibili
function getIndex(tipo) {
  const dir = tipo === 'chat'
    ? path.join(BASE_DIR, 'chat')
    : path.join(BASE_DIR, 'progetto');

  if (!fs.existsSync(dir)) return [];

  if (tipo === 'chat') {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.db'))
      .map(f => ({ nome: path.basename(f, '.db') }));
  }

  // tipo === 'progetto'
  const progetti = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    if (entry.isDirectory()) {
      const sotto = fs.readdirSync(path.join(dir, entry.name))
        .filter(f => f.endsWith('.db'))
        .map(f => path.basename(f, '.db'));
      progetti.push({ nome: entry.name, sottochat: sotto });
    }
  });
  return progetti;
}

module.exports = {
  loadMessages,
  appendMessage,
  getIndex,
};
