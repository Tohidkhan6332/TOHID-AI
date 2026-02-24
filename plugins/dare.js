const fetch = require('node-fetch');

module.exports = {
  command: 'dare',
  aliases: ['truthordare', 'challenge'],
  category: 'games',
  description: 'Get a random dare',
  usage: '.dare',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const shizokeys = 'shizo';
      const res = await fetch(
        `https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();
      const dareMessage = json.result;

      await sock.sendMessage(chatId, {
        text: dareMessage
      }, { quoted: message });

    } catch (error) {
      console.error('Error in dare command:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to get dare. Please try again later!'
      }, { quoted: message });
    }
  }
};
