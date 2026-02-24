const axios = require('axios');

module.exports = {
  command: 'convert',
  aliases: ['unit', 'unitconvert'],
  category: 'tools',
  description: 'Convert units (e.g., c → f, m → km, kg → g)',
  usage: '.convert <from_unit> <to_unit> <value>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (!args || args.length < 3) {
      return await sock.sendMessage(chatId, { text: '*Usage:* .convert <from_unit> <to_unit> <value>\nExample: .convert c f 20' }, { quoted: message });
    }

    const fromUnit = args[0].toLowerCase();
    const toUnit = args[1].toLowerCase();
    const value = args[2];

    if (isNaN(value)) {
      return await sock.sendMessage(chatId, { text: '❌ Value must be a number.' }, { quoted: message });
    }

    try {
      const apiUrl = `https://discardapi.dpdns.org/api/convert/unit?apikey=guru&from=${encodeURIComponent(fromUnit)}&to=${encodeURIComponent(toUnit)}&value=${encodeURIComponent(value)}`;

      const { data } = await axios.get(apiUrl, { timeout: 10000 });

      if (!data?.status) {
        return await sock.sendMessage(chatId, { text: '❌ Failed to convert the units. Check if the units are correct.' }, { quoted: message });
      }

      const reply = 
        `⚡ *Unit Conversion*\n\n` +
        `🔹 From: ${data.input} ${data.from}\n` +
        `🔹 To: ${data.to}\n` +
        `✅ Result: ${data.output}\n\n` +
        `💡 Tip: You can convert all units like m, km, kg, g, c, f, etc.`;

      await sock.sendMessage(chatId, { text: reply }, { quoted: message });

    } catch (error) {
      console.error('Unit conversion plugin error:', error);

      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(chatId, { text: '❌ Request timed out. The API may be slow or unreachable.' }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '❌ Failed to convert units.' }, { quoted: message });
      }
    }
  }
};
