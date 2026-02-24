const fetch = require('node-fetch');

module.exports = {
  command: 'truth',
  aliases: ['truthdare'],
  category: 'games',
  description: 'Get a random truth from the Shizo API.',
  usage: '.truth',
  
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const shizokeys = 'shizo';
      const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=${shizokeys}`);
      if (!res.ok) {
        throw await res.text();
      }
      const json = await res.json();
      const truthMessage = json.result;
      
      await sock.sendMessage(chatId, { 
        text: truthMessage 
      }, { quoted: message });
    } catch (error) {
      console.error('Error in truth command:', error);
      await sock.sendMessage(chatId, { 
        text: '❌ Failed to get truth. Please try again later!' 
      }, { quoted: message });
    }
  }
};
