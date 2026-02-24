const axios = require('axios');

// Utility to decode Unicode escapes
function decodeUnicode(str) {
  if (!str) return 'N/A';
  return str.replace(/\\u[\dA-F]{4}/gi, match =>
    String.fromCharCode(parseInt(match.replace("\\u", ""), 16))
  );
}

module.exports = {
  command: 'genshin',
  aliases: ['gh', 'uid'],
  category: 'stalk',
  description: 'Stalk Genshin Impact UID',
  usage: '.genshin <UID>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (!args.length) {
      return await sock.sendMessage(chatId, {
        text: '*Please provide a Genshin UID.*\nExample: .genshin 826401293'
      }, { quoted: message });
    }
    const uid = args[0];
    try {
      const { data } = await axios.get(`https://discardapi.dpdns.org/api/stalk/genshin`, {
        params: { apikey: 'guru', text: uid }
      });

      if (!data?.result) {
        return await sock.sendMessage(chatId, { text: '❌ UID not found or invalid.' }, { quoted: message });
      }

      const result = data.result;
      const caption = `🎮 *Genshin UID Info*\n\n` +
                      `👤 Nickname: ${result.nickname || 'N/A'}\n` +
                      `🆔 UID: ${result.uid || 'N/A'}\n` +
                      `🏆 Achievements: ${result.achivement || 'N/A'}\n` +
                      `⚡ Level: ${result.level || 'N/A'}\n` +
                      `🌌 World Level: ${result.world_level || 'N/A'}\n` +
                      `🌀 Spiral Abyss: ${decodeUnicode(result.spiral_abyss)}\n` +
                      `💳 Card ID: ${result.card_id || 'N/A'}`;

      await sock.sendMessage(chatId, { image: { url: result.image }, caption: caption }, { quoted: message });

    } catch (err) {
      console.error('Genshin plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch UID info.' }, { quoted: message });
    }
  }
};
