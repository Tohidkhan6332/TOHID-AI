const CommandHandler = require('../lib/commandHandler');
const settings = require("../settings");
const fs = require('fs');
const path = require('path');

const menuEmojis = ['✨', '🌟', '⭐', '💫', '🎯', '🎨', '🎪', '🎭'];
const activeEmojis = ['✅', '🟢', '💚', '✔️', '☑️'];
const disabledEmojis = ['❌', '🔴', '⛔', '🚫', '❎'];
const fastEmojis = ['⚡', '🚀', '💨', '⏱️', '🔥'];
const slowEmojis = ['🐢', '🐌', '⏳', '⌛', '🕐'];
const categoryEmojis = {
    general: ['📱', '🔧', '⚙️', '🛠️'],
    owner: ['👑', '🔱', '💎', '🎖️'],
    admin: ['🛡️', '⚔️', '🔐', '👮'],
    group: ['👥', '👫', '🧑‍🤝‍🧑', '👨‍👩‍👧‍👦'],
    download: ['📥', '⬇️', '💾', '📦'],
    ai: ['🤖', '🧠', '💭', '🎯'],
    search: ['🔍', '🔎', '🕵️', '📡'],
    apks: ['📲', '📦', '💿', '🗂️'],
    info: ['ℹ️', '📋', '📊', '📄'],
    fun: ['🎮', '🎲', '🎰', '🎪'],
    stalk: ['👀', '🔭', '🕵️', '🎯'],
    games: ['🎮', '🕹️', '🎯', '🏆'],
    images: ['🖼️', '📸', '🎨', '🌄'],
    menu: ['📜', '📋', '📑', '📚'],
    tools: ['🔨', '🔧', '⚡', '🛠️'],
    stickers: ['🎭', '😀', '🎨', '🖼️'],
    quotes: ['💬', '📖', '✍️', '💭'],
    music: ['🎵', '🎶', '🎧', '🎤'],
    utility: ['📂', '🔧', '⚙️', '🛠️']
};

function getRandomEmoji(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getCategoryEmoji(category) {
    const emojis = categoryEmojis[category.toLowerCase()] || ['📂', '📁', '🗂️', '📋'];
    return getRandomEmoji(emojis);
}

function formatTime() {
    const now = new Date();
    const options = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: settings.timeZone || 'UTC'
    };
    return now.toLocaleTimeString('en-US', options);
}

module.exports = {
  command: 'smenu',
  aliases: ['shelp', 'smart', 'tmenu', 'helps'],
  category: 'general',
  description: 'Interactive smart menu with live status',
  usage: '.smenu',
  isPrefixless: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const imagePath = path.join(__dirname, '../assets/tohid1.jpg');
      const thumbnail = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

      const categories = Array.from(CommandHandler.categories.keys());
      const stats = CommandHandler.getDiagnostics();
      
      const menuEmoji = getRandomEmoji(menuEmojis);
      
      const activeEmoji = getRandomEmoji(activeEmojis);
      const disabledEmoji = getRandomEmoji(disabledEmojis);
      const fastEmoji = getRandomEmoji(fastEmojis);
      const slowEmoji = getRandomEmoji(slowEmojis);

      let menuText = `${menuEmoji} *${settings.botName || 'TOHID-AI'}* ${menuEmoji}\n\n`;
      menuText += `┏━━━━━━━━━━━━━━━━┓\n`;
      menuText += `┃ 📱 *Bot:* ${settings.botName || 'TOHID-AI'}\n`;
      menuText += `┃ 🔖 *Version:* ${settings.version || '1.0.0'}\n`;
      menuText += `┃ 👤 *Owner:* ${settings.botOwner || 'Unknown'}\n`;
      menuText += `┃ ⏰ *Time:* ${formatTime()}\n`;
      menuText += `┃ ℹ️ *Prefix:* ${settings.prefixes ? settings.prefixes.join(', ') : '.'}\n`;
      menuText += `┃ 📊 *Plugins:* ${CommandHandler.commands.size}\n`;
      menuText += `┗━━━━━━━━━━━━━━━━┛\n\n`;

      const topCmds = stats.slice(0, 3).filter(s => s.usage > 0);
      if (topCmds.length > 0) {
        menuText += `🔥 *TOP COMMANDS:*\n`;
        topCmds.forEach((c, i) => {
          const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
          menuText += `${rank} .${c.command} • ${c.usage} uses\n`;
        });
        menuText += `\n`;
      }

      for (const cat of categories) {
        const catEmoji = getCategoryEmoji(cat);
        menuText += `${catEmoji} *${cat.toUpperCase()}*\n`;
        menuText += `┌─────────────────\n`;
        
        const catCmds = CommandHandler.getCommandsByCategory(cat);
        
        catCmds.forEach((cmdName, index) => {
          const isLast = index === catCmds.length - 1;
          const prefix = isLast ? '└' : '├';
          
          const isOff = CommandHandler.disabledCommands.has(cmdName.toLowerCase());
          const cmdStats = stats.find(s => s.command === cmdName.toLowerCase());
          
          const statusIcon = isOff ? disabledEmoji : activeEmoji;
          
          let speedTag = '';
          if (cmdStats && !isOff) {
            const ms = parseFloat(cmdStats.average_speed);
            if (ms > 0 && ms < 100) speedTag = ` ${fastEmoji}`;
            else if (ms > 1000) speedTag = ` ${slowEmoji}`;
          }
          
          menuText += `${prefix}─ ${statusIcon} .${cmdName}${speedTag}\n`;
        });
        menuText += `\n`;
      }

      menuText += `┌────────────────\n`;
      menuText += `├  💡 *LEGEND*\n`;
      menuText += `├─ ${activeEmoji} Active Command\n`;
      menuText += `├─ ${disabledEmoji} Disabled Command\n`;
      menuText += `├─ ${fastEmoji} Fast Response\n`;
      menuText += `├─ ${slowEmoji} Slow Response\n`;
      menuText += `⁠└────────────────`;

      const messageOptions = {
        image: thumbnail,
        caption: menuText,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363207624903731@newsletter',
            newsletterName: settings.botName || '𝐓𝐎𝐇𝐈𝐃-𝐀𝐈',
            serverMessageId: -1
          }
        }
      };

      await sock.sendMessage(chatId, messageOptions, { quoted: message });

    } catch (error) {
      console.error('Menu Error:', error);
      await sock.sendMessage(chatId, { 
        text: `❌ *Menu Error*\n\n${error.message}`
      }, { quoted: message });
    }
  }
};
