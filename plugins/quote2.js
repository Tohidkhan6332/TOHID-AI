const axios = require('axios');

module.exports = {
  command: 'quote2',
  aliases: ['quotes2', 'randomquote'],
  category: 'quotes',
  description: 'Get a random inspirational quote',
  usage: '.quote2',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await axios.get('https://discardapi.dpdns.org/api/quotes/random?apikey=guru');

      if (!res.data || res.data.status !== true) {
        return await sock.sendMessage(chatId, { text: '❌ Failed to fetch quote.' }, { quoted: message });
      }

      const quote = res.data.result?.quote || 'No quote found.';
      const creator = res.data.creator || 'Unknown';

      const replyText = `💬 *Random Quote*\n\n${quote}`;

      await sock.sendMessage(chatId, { text: replyText }, { quoted: message });

    } catch (err) {
      console.error('Quote plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Error while fetching quote.' }, { quoted: message });
    }
  }
};

