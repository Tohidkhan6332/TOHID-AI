const axios = require('axios');

module.exports = {
  command: 'xstalk',
  aliases: ['twstalk', 'xprofile'],
  category: 'stalk',
  description: 'Lookup Twitter user profile',
  usage: '.xstalk <username>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (!args.length) {
      return await sock.sendMessage(chatId, {
        text: '*Please provide a Twitter username.*\nExample: .xstalk HarmeetSinghPk'
      }, { quoted: message });
    }

    const username = args[0];

    try {
      const { data } = await axios.get(`https://discardapi.dpdns.org/api/stalk/twitter`, {
        params: { apikey: 'guru', username: username }
      });

      if (!data?.result) {
        return await sock.sendMessage(chatId, { text: '❌ Twitter user not found.' }, { quoted: message });
      }

      const result = data.result;
      const profileImage = result.profile?.image || null;
      const bannerImage = result.profile?.banner || null;
      const verifiedMark = result.verified ? '✅ Verified' : '';

      const caption = `🐦 *Twitter Profile Info*\n\n` +
                      `👤 Name: ${result.name || 'N/A'} ${verifiedMark}\n` +
                      `🆔 Username: @${result.username || 'N/A'}\n` +
                      `📝 Bio: ${result.description || 'N/A'}\n` +
                      `📍 Location: ${result.location || 'N/A'}\n` +
                      `📅 Joined: ${new Date(result.created_at).toDateString()}\n\n` +
                      `👥 Followers: ${result.stats?.followers || 0}\n` +
                      `➡ Following: ${result.stats?.following || 0}\n` +
                      `❤️ Likes: ${result.stats?.likes || 0}\n` +
                      `🖼 Media: ${result.stats?.media || 0}\n` +
                      `🐦 Tweets: ${result.stats?.tweets || 0}\n` +
                      `🔗 Profile URL: https://twitter.com/${result.username}`;

      if (profileImage) {
        await sock.sendMessage(chatId, { image: { url: profileImage }, caption: caption }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: caption }, { quoted: message });
      }

      if (bannerImage) {
        await sock.sendMessage(chatId, { image: { url: bannerImage }, caption: `📌 Banner of @${username}` });
      }

    } catch (err) {
      console.error('Twitter plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch Twitter profile.' }, { quoted: message });
    }
  }
};
