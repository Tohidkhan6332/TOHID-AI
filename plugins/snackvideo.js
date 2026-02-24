const axios = require('axios');

module.exports = {
  command: 'snack',
  aliases: ['snackvideo', 'snackdl'],
  category: 'download',
  description: 'Download media (video or image) from SnackVideo URL',
  usage: '.snack <SnackVideo URL>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args?.[0];

    if (!url) {
      return await sock.sendMessage(chatId, { text: 'Please provide a SnackVideo URL.\nExample: .snack https://sck.io/p/...' }, { quoted: message });
    }

    try {
      const apiUrl = `https://discardapi.dpdns.org/api/dl/snack?apikey=guru&url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl, { timeout: 10000 });

      if (!data?.status || !data.result?.length) {
        return await sock.sendMessage(chatId, { text: '❌ No media found for this SnackVideo URL.' }, { quoted: message });
      }

      for (let mediaItem of data.result) {
        if (mediaItem.video) {
          await sock.sendMessage(chatId, { video: { url: mediaItem.video }, caption: '📹 SnackVideo Video' }, { quoted: message });
        }
        if (mediaItem.image) {
          await sock.sendMessage(chatId, { image: { url: mediaItem.image }, caption: '🖼 SnackVideo Image' }, { quoted: message });
        }
      }

    } catch (error) {
      console.error('SnackVideo plugin error:', error);
      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(chatId, { text: '❌ Request timed out. The API may be slow or unreachable.' }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '❌ Failed to fetch SnackVideo media.' }, { quoted: message });
      }
    }
  }
};
