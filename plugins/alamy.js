/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/


const axios = require('axios');

module.exports = {
  command: 'alamy',
  aliases: ['alamydl', 'alamydownload'],
  category: 'download',
  description: 'Download image or video from Alamy URL',
  usage: '.alamy <Alamy URL>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args?.[0]?.trim();

    if (!url) {
      return await sock.sendMessage(chatId, { text: '❌ Please provide an Alamy URL.\nExample: .alamy https://www.alamy.com/video/beautiful-lake...' }, { quoted: message });
    }

    try {
      const apiUrl = `https://discardapi.dpdns.org/api/dl/alamy?apikey=guru&url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl, { timeout: 10000 });

      if (!data?.status || !data.result?.length) {
        return await sock.sendMessage(chatId, { text: '❌ Failed to fetch media from the provided Alamy URL.' }, { quoted: message });
      }

      for (const item of data.result) {
        if (item.video) {
          await sock.sendMessage(chatId, { video: { url: item.video }, caption: '🎬 *Alamy Video*' }, { quoted: message });
        }
        if (item.image) {
          await sock.sendMessage(chatId, { image: { url: item.image }, caption: '🖼️ *Alamy Image*' }, { quoted: message });
        }
      }

    } catch (error) {
      console.error('Alamy download plugin error:', error);

      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(chatId, { text: '❌ Request timed out. The API may be slow or unreachable.' }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '❌ Failed to download media from Alamy URL.' }, { quoted: message });
      }
    }
  }
};

/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/
