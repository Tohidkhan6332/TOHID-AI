const axios = require('axios');

module.exports = {
  command: 'tech',
  aliases: ['technology', 'techimg'],
  category: 'images',
  description: 'Get a random tech image',
  usage: '.tech',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await axios.get('https://raw.githubusercontent.com/Tohidkhan6332/Database/main/images/tech.json');

      if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
        return await sock.sendMessage(chatId, { text: '❌ Failed to fetch image.' }, { quoted: message });
      }

      const randomImage = res.data[Math.floor(Math.random() * res.data.length)];

      await sock.sendMessage(chatId, { image: { url: randomImage }, caption: '💻 Tech Image' }, { quoted: message });

    } catch (err) {
      console.error('Tech image plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Error while fetching image.' }, { quoted: message });
    }
  }
};
