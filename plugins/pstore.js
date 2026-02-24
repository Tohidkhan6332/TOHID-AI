const axios = require('axios');

module.exports = {
  command: 'pstore',
  aliases: ['playstore'],
  category: 'apks',
  description: 'Search apps on Play Store and get app details',
  usage: '.pstore <app_name>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();

    try {
      if (!query) return await sock.sendMessage(chatId, { text: '*Please provide an app name.*\nExample: .playstore Instagram' }, { quoted: message });

      await sock.sendMessage(chatId, { text: '🔎 Searching Play Store...' }, { quoted: message });

      /* 🔍 SEARCH */
      const searchUrl = `https://discardapi.dpdns.org/api/apk/search/playstore?apikey=guru&query=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl);
      console.log('🔍 PlayStore Search Response:', searchRes.data);

      const results = searchRes.data?.result;
      if (!Array.isArray(results) || results.length === 0)
        return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });

      const firstImg = results[0].img;

      let caption = `📱 *Play Store Results for:* *${query}*\n\n↩️ *Reply with a number to view details*\n\n`;
      results.forEach((v, i) => caption += `*${i + 1}.* ${v.name}\n👨‍💻 ${v.developer}\n⭐ ${v.rating_Num}\n🔗 ${v.link}\n\n`);

      const sentMsg = await sock.sendMessage(chatId, { image: { url: firstImg }, caption }, { quoted: message });

      /* ⏱ AUTO EXPIRE */
      const timeout = setTimeout(async () => {
        sock.ev.off('messages.upsert', listener);
        await sock.sendMessage(chatId, { text: '⌛ Selection expired. Please search again.' }, { quoted: sentMsg });
      }, 5 * 60 * 1000);

      /* 📥 REPLY HANDLER */
      const listener = async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.remoteJid !== chatId) return;

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        if (!ctx?.stanzaId || ctx.stanzaId !== sentMsg.key.id) return;

        const replyText = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const choice = parseInt(replyText.trim());
        if (isNaN(choice) || choice < 1 || choice > results.length)
          return await sock.sendMessage(chatId, { text: `❌ Invalid choice. Pick 1-${results.length}.` }, { quoted: m });

        clearTimeout(timeout);
        sock.ev.off('messages.upsert', listener);

        const selected = results[choice - 1];
        await sock.sendMessage(chatId, { text: `ℹ️ Fetching app details for *${selected.name}*...` }, { quoted: m });

        /* 📦 DETAILS */
        const dlUrl = `https://discardapi.dpdns.org/api/apk/dl/playstore?apikey=guru&url=${encodeURIComponent(selected.link)}`;
        const dlRes = await axios.get(dlUrl);
        console.log('📥 PlayStore Detail Response:', dlRes.data);

        const app = dlRes.data?.result;
        if (!app)
          return await sock.sendMessage(chatId, { text: '❌ Failed to fetch app details.' }, { quoted: m });

        const info =
          `📱 *App Details*\n\n` +
          `📛 Name: ${app.name}\n` +
          `👨‍💻 ${app.developer}\n` +
          `🆕 ${app.publish}\n` +
          `🔢 Version: ${app.version}\n\n` +
          `🔗 Play Store Link:\n${selected.link}`;

        await sock.sendMessage(chatId, { image: { url: app.icon }, caption: info }, { quoted: m });
      };

      sock.ev.on('messages.upsert', listener);

    } catch (err) {
      console.error('❌ PlayStore Plugin Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to process request.' }, { quoted: message });
    }
  }
};
    
