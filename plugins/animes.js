const axios = require('axios');

const supportedAnimes = [
  'akira','akiyama','anna','asuna','ayuzawa','boruto','chiho','chitoge',
  'deidara','erza','elaina','eba','emilia','hestia','hinata','inori',
  'isuzu','itachi','itori','kaga','kagura','kaori','keneki','kotori',
  'kurumi','madara','mikasa','miku','minato','naruto','nezuko','sagiri',
  'sasuke','sakura'
];

function pickRandom(arr, count = 1) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const animuMenu =
'🎀 *Animes Menu* 🎀\n\n' +
'• *akira*\n' +
'• *akiyama*\n' +
'• *anna*\n' +
'• *asuna*\n' +
'• *ayuzawa*\n' +
'• *boruto*\n' +
'• *chiho*\n' +
'• *chitoge*\n' +
'• *deidara*\n' +
'• *erza*\n' +
'• *elaina*\n' +
'• *eba*\n' +
'• *emilia*\n' +
'• *hestia*\n' +
'• *hinata*\n' +
'• *inori*\n' +
'• *isuzu*\n' +
'• *itachi*\n' +
'• *itori*\n' +
'• *kaga*\n' +
'• *kagura*\n' +
'• *kaori*\n' +
'• *keneki*\n' +
'• *kotori*\n' +
'• *kurumi*\n' +
'• *madara*\n' +
'• *mikasa*\n' +
'• *miku*\n' +
'• *minato*\n' +
'• *naruto*\n' +
'• *nezuko*\n' +
'• *sagiri*\n' +
'• *sasuke*\n' +
'• *sakura*\n\n' +
'📌 *Usage:*\n' +
'.animes <name>\n' +
'Example: *.animes naruto*';

module.exports = {
  command: 'animes',
  aliases: ['animeimg', 'animepic'],
  category: 'menu',
  description: 'Send random anime images',
  usage: '.animes <anime_name>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const input = args[0] ? args[0] : '';
    const typeLower = input.toLowerCase();

    if (!input || !supportedAnimes.includes(typeLower)) {
      const replyText = input && !supportedAnimes.includes(typeLower)
        ? `Unsupported anime: ${typeLower}\n\n`
        : '';
      return await sock.sendMessage(chatId, { text: replyText + animuMenu }, { quoted: message });
    }

    try {
      const apiUrl = `https://raw.githubusercontent.com/Guru322/api/Guru/BOT-JSON/anime-${typeLower}.json`;
      const res = await axios.get(apiUrl, { timeout: 15000, validateStatus: s => s < 500 });
      const images = res.data;
      if (!Array.isArray(images) || images.length === 0) throw new Error('No images found');
      const randomImages = pickRandom(images, Math.min(3, images.length));

      for (const img of randomImages) {
        try {
          const imageData = await axios.get(img, { responseType: 'arraybuffer', timeout: 15000 });
          await sock.sendMessage(chatId, { image: Buffer.from(imageData.data), caption: `_${typeLower}_` }, { quoted: message });
        } catch {}
      }

    } catch (err) {
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch anime images. Please try again later.' }, { quoted: message });
    }
  }
};

