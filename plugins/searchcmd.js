/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/

const CommandHandler = require('../lib/commandHandler');

module.exports = {
  command: 'find',
  aliases: ['lookup', 'searchcmd'],
  category: 'general',
  description: 'Find a command by keyword or description',
  usage: '.find [keyword]',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').toLowerCase();

    if (!query) {
      return await sock.sendMessage(chatId, { text: 'What are you looking for? Example: *.find status*' }, { quoted: message });
    }

    try {
      const allCommands = Array.from(CommandHandler.commands.values());

      const results = allCommands.filter(commandObject => {
        const nameMatch = commandObject.command?.toLowerCase().includes(query);
        const descMatch = commandObject.description?.toLowerCase().includes(query);
        const aliasMatch = commandObject.aliases?.some(a => a.toLowerCase().includes(query));

        return nameMatch || descMatch || aliasMatch;
      });

      if (results.length === 0) {
        const suggestion = CommandHandler.findSuggestion(query);
        let failText = `❌ No commands found matching *"${query}"*`;
        if (suggestion) failText += `\n\nDid you mean: *.${suggestion}*?`;
        
        return await sock.sendMessage(chatId, { text: failText }, { quoted: message });
      }

      let resultText = `🔍 *SEARCH RESULTS FOR:* "${query.toUpperCase()}"\n\n`;

      results.forEach((res, index) => {
        const status = CommandHandler.disabledCommands.has(res.command.toLowerCase()) ? '🔸' : '🔹';
        resultText += `${index + 1}. ${status} *.${res.command}*\n`;
        resultText += `📝 _${res.description || 'No description available.'}_\n`;
        if (res.aliases && res.aliases.length > 0) {
          resultText += `🔗 Aliases: ${res.aliases.join(', ')}\n`;
        }
        resultText += `\n`;
      });

      resultText += `💡 _Tip: Use the prefix before the command name to run it._`;

      await sock.sendMessage(chatId, { text: resultText }, { quoted: message });

    } catch (error) {
      console.error('Search Error:', error);
      await sock.sendMessage(chatId, { text: '❌ An error occurred during the search.' });
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