const Qasim = require('api-qasim');
module.exports = {
  command: 'npmstalk',
  aliases: ['npmstlk'],
  category: 'stalk',
  description: 'Get details about an NPM package',
  usage: '.npmstalk <package-name>',

  async handler(sock, message, args, context = {}) {
    const { chatId, usedPrefix, command } = context;

    if (!args[0]) {
      return await sock.sendMessage(chatId, { 
        text: `✳️ Please provide an NPM package name.\n\nExample:\n.npmstalk axios` 
      }, { quoted: message });
    }

    try {

      let res = await Qasim.npmStalk(args[0]);

      if (!res || !res.result) {
        throw 'Package not found or API error.';
      }

      const data = res.result;
      const authorName = (typeof data.author === 'object') ? data.author.name : (data.author || 'Unknown');
      
      const versionCount = data.versions ? Object.keys(data.versions).length : 0;

      let te = `┌──「 *NPM PACKAGE INFO* 」\n`;
      te += `▢ *🔖Name:* ${data.name}\n`;
      te += `▢ *🔖Creator:* ${authorName}\n`;
      te += `▢ *👥Total Versions:* ${versionCount}\n`;
      te += `▢ *📌Description:* ${data.description || 'No description'}\n`;
      te += `▢ *🧩Repository:* ${data.repository?.url || 'No repository available'}\n`;
      te += `▢ *🌍Homepage:* ${data.homepage || 'No homepage available'}\n`;
      te += `▢ *🏷️Latest:* ${data['dist-tags']?.latest || 'N/A'}\n`;
      te += `▢ *🔗Link:* https://npmjs.com/package/${data.name}\n`;
      te += `└────────────`;

      await sock.sendMessage(chatId, { text: te }, { quoted: message });

    } catch (error) {
      console.error('NPM Stalk Error:', error);
      await sock.sendMessage(chatId, { text: `✳️ Error: Package not found or API issue.` }, { quoted: message });
    }
  }
};
        
