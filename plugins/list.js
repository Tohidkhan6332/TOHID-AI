/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/


const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const path = require('path');
const fs = require('fs');

/* ================= TIME FORMAT ================= */

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: settings.timeZone || 'UTC'
  });
}

/* ================= MENU STYLES (7) ================= */

const menuStyles = [

  // STYLE 1
  {
    render({ info, categories, prefix }) {
      let t = `╭━━『 *TOHID-AI MENU* 』━⬣\n`;
      t += `┃ ✨ Bot: ${info.bot}\n`;
      t += `┃ 🔧 Prefix: ${info.prefix}\n`;
      t += `┃ 📦 Plugins: ${info.total}\n`;
      t += `┃ 💎 Version: ${info.version}\n`;
      t += `┃ ⏰ Time: ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += `┃━━━ *${cat.toUpperCase()}* ━✦\n`;
        for (const c of cmds) t += `┃ ➤ ${prefix}${c}\n`;
      }
      t += `╰━━━━━━━━━━━━━⬣`;
      return t;
    }
  },

  // STYLE 2
  {
    render({ info, categories, prefix }) {
      let t = `◈╭─❍「 *TOHID-AI MENU* 」❍\n`;
      t += `◈├• 🌟 Bot: ${info.bot}\n`;
      t += `◈├• ⚙️ Prefix: ${info.prefix}\n`;
      t += `◈├• 🍫 Plugins: ${info.total}\n`;
      t += `◈├• 💎 Version: ${info.version}\n`;
      t += `◈├• ⏰ Time: ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += `◈├─❍「 ${cat.toUpperCase()} 」❍\n`;
        for (const c of cmds) t += `◈├• ${prefix}${c}\n`;
      }
      t += `◈╰──★─☆──♪♪─❍`;
      return t;
    }
  },

  // STYLE 3
  {
    render({ info, categories, prefix }) {
      let t = `┏━━━━ *TOHID-AI MENU* ━━━┓\n`;
      t += `┃ Bot : ${info.bot}\n`;
      t += `┃ Prefix : ${info.prefix}\n`;
      t += `┃ Plugins : ${info.total}\n`;
      t += `┃ Version : ${info.version}\n`;
      t += `┃ Time : ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += `┃━━━━ ${cat.toUpperCase()} ━━◆\n`;
        for (const c of cmds) t += `┃ ▸ ${prefix}${c}\n`;
      }
      t += `┗━━━━━━━━━━━━━━━┛`;
      return t;
    }
  },

  // STYLE 4
  {
    render({ info, categories, prefix }) {
      let t = `✦═══ TOHID-AI MENU ═══✦\n`;
      t += `║ Bot: ${info.bot}\n`;
      t += `║ Prefix: ${info.prefix}\n`;
      t += `║ Plugins: ${info.total}\n`;
      t += `║ Version: ${info.version}\n`;
      t += `║ Time: ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += `║══ ${cat.toUpperCase()} ══✧\n`;
        for (const c of cmds) t += `║ ✦ ${prefix}${c}\n`;
      }
      t += `✦══════════════✦`;
      return t;
    }
  },

  // STYLE 5
  {
    render({ info, categories, prefix }) {
      let t = `❀━━━ TOHID-AI MENU ━━━❀\n`;
      t += `┃ Bot: ${info.bot}\n`;
      t += `┃ Prefix: ${info.prefix}\n`;
      t += `┃ Plugins: ${info.total}\n`;
      t += `┃ Version: ${info.version}\n`;
      t += `┃ Time: ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += `┃━━━〔 ${cat.toUpperCase()} 〕━❀\n`;
        for (const c of cmds) t += `┃☞ ${prefix}${c}\n`;
      }
      t += `❀━━━━━━━━━━━━━━❀`;
      return t;
    }
  },

  // STYLE 6
  {
    render({ info, categories, prefix }) {
      let t = `◆━━━ TOHID-AI MENU ━━━◆\n`;
      t += `┃ Bot: ${info.bot}\n`;
      t += `┃ Prefix: ${info.prefix}\n`;
      t += `┃ Plugins: ${info.total}\n`;
      t += `┃ Version: ${info.version}\n`;
      t += `┃ Time: ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += `┃━━ ${cat.toUpperCase()} ━━◆◆\n`;
        for (const c of cmds) t += `┃ ◈ ${prefix}${c}\n`;
      }
      t += `◆━━━━━━━━━━━━━━━━◆`;
      return t;
    }
  },

  // STYLE 7
  {
    render({ info, categories, prefix }) {
      let t = `╭───⬣ TOHID-AI MENU ──⬣\n`;
      t += ` | ● Bot: ${info.bot}\n`;
      t += ` | ● Prefix: ${info.prefix}\n`;
      t += ` | ● Plugins: ${info.total}\n`;
      t += ` | ● Version: ${info.version}\n`;
      t += ` | ● Time: ${info.time}\n`;
      for (const [cat, cmds] of categories) {
        t += ` |───⬣ ${cat.toUpperCase()} ──⬣\n`;
        for (const c of cmds) t += ` | ● ${prefix}${c}\n`;
      }
      t += `╰──────────⬣`;
      return t;
    }
  }

];

/* ================= STYLE ↔ IMAGE MAP ================= */

const menuThemes = [
  { style: menuStyles[0], image: 'tohid1.jpg' },
  { style: menuStyles[1], image: 'tohid2.jpg' },
  { style: menuStyles[2], image: 'tohid3.jpg' },
  { style: menuStyles[3], image: 'tohid4.jpg' },
  { style: menuStyles[4], image: 'tohid5.jpg' },
  { style: menuStyles[5], image: 'tohid6.jpg' },
  { style: menuStyles[6], image: 'tohid7.jpg' }
];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
  command: 'menu',
  aliases: ['help', 'commands', 'h', 'list'],
  category: 'general',
  description: 'Show all commands',
  usage: '.menu [command]',

  async handler(sock, message, args, context) {

    const { chatId, channelInfo } = context;
    const prefix = settings.prefixes[0];

    /* ===== COMMAND INFO MODE ===== */

    if (args.length) {
      const search = args[0].toLowerCase();
      let cmd = commandHandler.commands.get(search);

      if (!cmd && commandHandler.aliases.has(search)) {
        cmd = commandHandler.commands.get(commandHandler.aliases.get(search));
      }

      if (!cmd) {
        return sock.sendMessage(chatId, {
          text: `❌ Command not found.\nUse ${prefix}menu`,
          ...channelInfo
        }, { quoted: message });
      }

      const text = `
╭━━━━━━━━━━━━━━⬣
┃ ⚡ Command: ${prefix}${cmd.command}
┃ 📝 Desc: ${cmd.description || 'No description'}
┃ 📖 Usage: ${cmd.usage || prefix + cmd.command}
┃ 🏷 Category: ${cmd.category || 'misc'}
┃ 🔖 Aliases: ${cmd.aliases?.length ? cmd.aliases.join(', ') : 'None'}
╰━━━━━━━━━━━━━━⬣`;

      return sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
    }

    /* ===== FULL MENU MODE ===== */

    const theme = pick(menuThemes);

    const text = theme.style.render({
      prefix,
      info: {
        bot: settings.botName,
        prefix: settings.prefixes.join(', '),
        total: commandHandler.commands.size,
        version: settings.version || "5.0.0",
        time: formatTime()
      },
      categories: commandHandler.categories
    });

    const imagePath = path.join(__dirname, '../assets', theme.image);

    if (fs.existsSync(imagePath)) {
      await sock.sendMessage(chatId, {
        image: { url: imagePath },
        caption: text,
        ...channelInfo
      }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, {
        text,
        ...channelInfo
      }, { quoted: message });
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