// 📄 memoria/sync.js
// Sincronizzazione periodica tra Render e ROG per la memoria chat

const fetch = require('node-fetch');
const {
  getMessaggiPendenti,
  eliminaMessaggio
} = require('./db');

// 🔁 URL del server ROG (tunnel attivo)
const ROG_URL = 'https://lulu-ai.loca.lt';

// Ogni 30 secondi
setInterval(async () => {
  try {
    const pendenti = await getMessaggiPendenti();
    if (pendenti.length === 0) return;

    console.log(`🔄 Tentativo di sync: ${pendenti.length} messaggi...`);

    for (const msg of pendenti) {
      const body = {
        chatId: msg.chat_id,
        message: JSON.parse(msg.message)
      };

      const res = await fetch(`${ROG_URL}/memoria/save-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        console.log(`✅ Sync riuscito per messaggio ID ${msg.id}`);
        await eliminaMessaggio(msg.id);
      } else {
        console.warn(`⚠️ Fallito sync ID ${msg.id}: codice ${res.status}`);
      }
    }

  } catch (err) {
    console.error('❌ Errore nel sync:', err.message);
  }
}, 30000); // ogni 30 secondi
