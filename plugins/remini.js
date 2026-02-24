const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }
  if (message.message?.imageMessage) {
    const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }
  return null;
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  command: 'remini',
  aliases: ['enhance', 'upscale'],
  category: 'tools',
  description: 'Enhance an image using Remini AI',
  usage: '.remini <image_url> or reply to an image with .remini',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      let imageUrl = null;

      if (args.length > 0) {
        const url = args.join(' ');
        if (isValidUrl(url)) {
          imageUrl = url;
        } else {
          return sock.sendMessage(chatId, {
            text: '❌ Invalid URL provided.\n\nUsage: `.remini https://example.com/image.jpg`'
          }, { quoted: message });
        }
      } else {
        imageUrl = await getQuotedOrOwnImageUrl(sock, message);
        if (!imageUrl) {
          return sock.sendMessage(chatId, {
            text: '📸 *Remini AI Enhancement Command*\n\nUsage:\n• `.remini <image_url>`\n• Reply to an image with `.remini`\n• Send image with `.remini`\n\nExample: `.remini https://example.com/image.jpg`'
          }, { quoted: message });
        }
      }

      const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`;
      const response = await axios.get(apiUrl, {
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (response.data && response.data.success && response.data.result?.image_url) {
        const imageResponse = await axios.get(response.data.result.image_url, {
          responseType: 'arraybuffer',
          timeout: 30000
        });

        if (imageResponse.status === 200 && imageResponse.data) {
          await sock.sendMessage(chatId, {
            image: imageResponse.data,
            caption: '✨ *Image enhanced successfully!*\n\n𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 𝗠𝗘𝗚𝗔 𝗔𝗜'
          }, { quoted: message });
        } else throw new Error('Failed to download enhanced image');
      } else throw new Error(response.data.result?.message || 'Failed to enhance image');

    } catch (error) {
      console.error('Remini Error:', error.message);
      let errorMessage = '❌ Failed to enhance image.';

      if (error.response?.status === 429) errorMessage = '⏰ Rate limit exceeded. Please try again later.';
      else if (error.response?.status === 400) errorMessage = '❌ Invalid image URL or format.';
      else if (error.response?.status === 500) errorMessage = '🔧 Server error. Please try again later.';
      else if (error.code === 'ECONNABORTED') errorMessage = '⏰ Request timeout. Please try again.';
      else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) errorMessage = '🌐 Network error. Please check your connection.';
      else if (error.message.includes('Failed to enhance image')) errorMessage = '❌ Image processing failed. Please try with a different image.';

      await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    }
  }
};
