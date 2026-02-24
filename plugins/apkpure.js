const axios = require('axios');

module.exports = {
  command: 'apkpure',
  aliases: ['apkpur', 'pureapk'],
  category: 'apks',
  description: 'Search APKs from APKPure and get download link',
  usage: '.apkpure <apk_name>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();

    try {
      if (!query) return await sock.sendMessage(chatId, { text: '*Please provide an app name.*\nExample: .apkpure Instagram' }, { quoted: message });

      await sock.sendMessage(chatId, { text: '🔎 Searching APKPure...' }, { quoted: message });

      /* 🔍 SEARCH */
      const searchUrl = `https://discardapi.dpdns.org/api/apk/search/apkpure?apikey=guru&query=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl);

      const results = searchRes.data?.result;
      if (!Array.isArray(results) || results.length === 0)
        return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });

      let caption = `📦 *APKPure Results for:* *${query}*\n\n↩️ *Reply with a number to get download link*\n\n`;
      results.forEach((v, i) => caption += `*${i + 1}.* ${v.name}\n👨‍💻 ${v.developer}\n🔗 ${v.url}\n\n`);

      const sentMsg = await sock.sendMessage(chatId, { text: caption }, { quoted: message });

      /* ⏱ AUTO EXPIRE */
      const timeout = setTimeout(async () => {
        sock.ev.off('messages.upsert', listener);
        await sock.sendMessage(chatId, { text: '⌛ Selection expired. Please search again.' }, { quoted: sentMsg });
      }, 3 * 60 * 1000);

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
        await sock.sendMessage(chatId, { text: `⬇️ Fetching download info for *${selected.name}*...` }, { quoted: m });

        /* 📦 DOWNLOAD INFO */
        const dlUrl = `https://discardapi.dpdns.org/api/apk/dl/apkpure?apikey=guru&url=${encodeURIComponent(selected.url)}`;
        const dlRes = await axios.get(dlUrl);

        const apk = dlRes.data?.result;
        if (!apk?.file?.url)
          return await sock.sendMessage(chatId, { text: '❌ Failed to fetch download link.' }, { quoted: m });

        const info =
          `📦 *APK Download Info*\n\n` +
          `📛 Name: ${apk.name}\n` +
          `👨‍💻 Developer: ${apk.developer}\n` +
          `📦 Size: ${apk.size}\n` +
          `📦 Package: ${apk.id}\n` +
          `🔢 Version: ${apk.version}\n\n` +
          `⬇️ *Download Link:*\n${apk.file.url}\n\n` +
          `⚠️ *Note:* APKPure blocks bot downloads. Please open link in browser.`;

        await sock.sendMessage(chatId, { text: info }, { quoted: m });
      };

      sock.ev.on('messages.upsert', listener);

    } catch (err) {
      console.error('❌ APKPure Plugin Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to process request.' }, { quoted: message });
    }
  }
};
