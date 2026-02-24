require('dotenv').config();

const settings = {
  // Array fallback: splits string by comma, or uses default array
  prefixes: process.env.PREFIXES ? process.env.PREFIXES.split(',') : ['.', '!', '/', '#'],
  
  packname: process.env.PACKNAME || '𝐓𝐎𝐇𝐈𝐃-𝐀𝐈',
  author: process.env.AUTHOR || 'Tohidkhan6332',
  timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
  botName: process.env.BOT_NAME || "𝐓𝐎𝐇𝐈𝐃-𝐀𝐈",
  botOwner: process.env.BOT_OWNER || '𝕄𝕣 𝕋𝕠𝕙𝕚𝕕',
  ownerNumber: process.env.OWNER_NUMBER || '917849917350',
  giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: process.env.COMMAND_MODE || "public",
  
  maxStoreMessages: Number(process.env.MAX_STORE_MESSAGES) || 20,
  tempCleanupInterval: Number(process.env.CLEANUP_INTERVAL) || 1 * 60 * 60 * 1000,
  storeWriteInterval: Number(process.env.STORE_WRITE_INTERVAL) || 10000,
  
  description: process.env.DESCRIPTION || "This is a bot for managing group commands and automating tasks.",
  version: "5.2.0",
  updateZipUrl: process.env.UPDATE_URL || "https://github.com/Tohidkhan6332/TOHID-AI/archive/refs/heads/main.zip",
  channelLink: process.env.CHANNEL_LINK || "https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T",
  ytch: process.env.YT_CHANNEL || "tohidkhan_6332"
};

module.exports = settings;
