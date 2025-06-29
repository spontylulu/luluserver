// 📄 memoria-router.js
// Router Express per gestire chat modulari in file .db distinti (chat o progetti)

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { salvaMessaggio } = require('./memoria/db');
const { loadMessages, appendMessage, getIndex } = require('./memoria-db');

// 🆕 Crea una nuova chat vuota
router.post('/chat-create/:chatName', async (req, res) => {
  try {
    const chatName = req.params.chatName;
    
    if (!chatName || chatName.trim() === '') {
      return res.status(400).send('❌ Nome chat non valido');
    }

    const initMessage = {
      mittente: 'system',
      contenuto: `Chat "${chatName}" creata`,
      timestamp: new Date().toISOString()
    };

    appendMessage("chat", chatName, initMessage);
    
    res.send(`✅ Chat "${chatName}" creata con successo`);
  } catch (err) {
    console.error(`❌ Errore creazione chat ${req.params.chatName}:`, err);
    res.status(500).send('❌ Errore creazione chat');
  }
});

// 📂 Carica messaggi da una chat singola
router.get('/chat/:chatName', async (req, res) => {
  try {
    const messages = loadMessages("chat", req.params.chatName);
    res.send(JSON.stringify(messages));
  } catch (err) {
    console.error(`❌ Errore lettura chat ${req.params.chatName}:`, err);
    res.status(500).send('❌ Errore lettura memoria');
  }
});

// 📩 Aggiunge un messaggio a una chat singola
router.post('/chat/:chatName', async (req, res) => {
  const msg = req.body;

  if (!msg || !msg.mittente || !msg.contenuto || !msg.timestamp) {
    return res.status(400).send('❌ Formato messaggio non valido');
  }

  try {
    appendMessage("chat", req.params.chatName, msg);
    res.send('✅ Messaggio salvato');
  } catch (err) {
    console.error(`❌ Errore salvataggio in chat ${req.params.chatName}:`, err);
    res.status(500).send('❌ Errore scrittura memoria');
  }
});

// 🆕 Crea un nuovo progetto con sottochat
router.post('/progetto-create/:projectName/:chatName', async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const chatName = req.params.chatName;
    
    if (!projectName || !chatName) {
      return res.status(400).send('❌ Nome progetto o chat non valido');
    }

    const initMessage = {
      mittente: 'system',
      contenuto: `Progetto "${projectName}" - Chat "${chatName}" creata`,
      timestamp: new Date().toISOString()
    };

    appendMessage("progetto", projectName, initMessage, chatName);
    
    res.send(`✅ Progetto "${projectName}" con chat "${chatName}" creato`);
  } catch (err) {
    console.error(`❌ Errore creazione progetto ${req.params.projectName}:`, err);
    res.status(500).send('❌ Errore creazione progetto');
  }
});

// 📂 Carica chat da un progetto
router.get('/progetto/:projectName/:chatName', async (req, res) => {
  try {
    const messages = loadMessages("progetto", req.params.projectName, req.params.chatName);
    res.send(JSON.stringify(messages));
  } catch (err) {
    console.error(`❌ Errore lettura progetto ${req.params.projectName}:`, err);
    res.status(500).send('❌ Errore lettura memoria');
  }
});

// 📩 Salva messaggio in una chat di progetto
router.post('/progetto/:projectName/:chatName', async (req, res) => {
  const msg = req.body;

  if (!msg || !msg.mittente || !msg.contenuto || !msg.timestamp) {
    return res.status(400).send('❌ Formato messaggio non valido');
  }

  try {
    appendMessage("progetto", req.params.projectName, msg, req.params.chatName);
    res.send('✅ Messaggio salvato');
  } catch (err) {
    console.error(`❌ Errore scrittura progetto ${req.params.projectName}:`, err);
    res.status(500).send('❌ Errore scrittura memoria');
  }
});

// 📋 Restituisce la lista delle chat disponibili in memoria/chat/
router.get('/chat-index', (req, res) => {
  try {
    const index = getIndex("chat");
    res.send(JSON.stringify(index));
  } catch (err) {
    console.error("❌ Errore lettura indice chat:", err);
    res.status(500).send('❌ Errore lettura indice chat');
  }
});

// 📋 Restituisce la lista dei progetti disponibili
router.get('/progetto-index', (req, res) => {
  try {
    const index = getIndex("progetto");
    res.send(JSON.stringify(index));
  } catch (err) {
    console.error("❌ Errore lettura indice progetti:", err);
    res.status(500).send('❌ Errore lettura indice progetti');
  }
});

// 🌐 Nuovo endpoint per salvataggio dinamico da Flutter
router.post('/save-message', async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message || !message.mittente || !message.contenuto || !message.timestamp) {
    return res.status(400).send('❌ Dati incompleti');
  }

  try {
    // Prova a inoltrare subito al ROG
    const response = await fetch(`https://lulu-ai.loca.lt/memoria/chat/${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      return res.send('✅ Messaggio inoltrato direttamente a ROG');
    } else {
      throw new Error(`ROG ha risposto con status ${response.status}`);
    }
  } catch (err) {
    // Se il ROG non è raggiungibile → salva in Render (SQLite)
    try {
      await salvaMessaggio(chatId, message);
      res.send('📦 ROG offline – Messaggio salvato in attesa di sync');
    } catch (dbErr) {
      console.error('❌ Errore salvataggio SQLite:', dbErr);
      res.status(500).send('❌ Errore salvataggio provvisorio');
    }
  }
});

module.exports = router;
