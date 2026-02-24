const fetch = require('node-fetch');
module.exports = {
  command: 'flirt',
  aliases: ['flirty', 'pickuplines'],
  category: 'fun',
  description: 'Get a random flirt message',
  usage: '.flirt',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    try {
      const shizokeys = 'shizo';
      const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${shizokeys}`);
      if (!res.ok) throw await res.text();
      const r = await res.json();
      await sock.sendMessage(chatId, { text: r.result }, { quoted: message });
    } catch (e) {
      console.error('Error in flirt command:', e);
      await sock.sendMessage(chatId, { text: '❌ Failed to get flirt message. Please try again later!' }, { quoted: message });
    }
  }
};
