const fetch = require('node-fetch');

module.exports = {
  command: 'tinyurl',
  aliases: ['shorten', 'tiny'],
  category: 'tools',
  description: 'Shorten a URL using TinyURL',
  usage: '.tinyurl <url>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args?.join(' ')?.trim();

    if (!query) {
      return await sock.sendMessage(chatId, { text: '*Please provide a URL to shorten.*\nExample: .tinyurl https://example.com' }, { quoted: message });
    }

    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(query)}`);
      const shortUrl = await response.text();

      if (!shortUrl) {
        return await sock.sendMessage(chatId, { text: '❌ Error: Could not generate a short URL.' }, { quoted: message });
      }

      const output = 
        `✨ *YOUR SHORT URL*\n\n` +
        `🔗 *Original Link:*\n${query}\n\n` +
        `✂️ *Shortened URL:*\n${shortUrl}`;

      await sock.sendMessage(chatId, { text: output }, { quoted: message });

    } catch (err) {
      console.error('TinyURL plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to shorten URL.' }, { quoted: message });
    }}
};

