// 📄 server.js
// Avvia il server Express di Lulu per la memoria centralizzata basata su SQLite
// Carica preferenze globali e routing dinamico per chat e progetti

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const memoriaRouter = require('./memoria-router');

// Configura app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Assicura che le directory necessarie esistano
const requiredDirs = [
  path.join(__dirname, 'memoria'),
  path.join(__dirname, 'memoria', 'chat'),
  path.join(__dirname, 'memoria', 'progetti')
];

requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Creata cartella: ${dir}`);
  }
});

// In futuro potremo caricare preferenze.db all'avvio qui

// Routing memoria
app.use('/memoria', memoriaRouter);

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Lulu Memory Server attivo su http://localhost:${PORT}`);
});

// 🧠 Avvia il modulo di sincronizzazione con il server ROG
require('./memoria/sync');
