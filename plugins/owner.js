const settings = require('../settings');

module.exports = {
  command: 'owner',
  aliases: ['creator'],
  category: 'info',
  description: 'Get the contact of the bot owner',
  usage: '.owner',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    try {
      const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner}
TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}
END:VCARD
      `.trim();
      await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
      }, { quoted: message });
    } catch (error) {
      console.error('Owner Command Error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to fetch owner contact.'
      }, { quoted: message });
    }
  }
};
