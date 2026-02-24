const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { uploadToPomf2 } = require('../lib/uploaders');

module.exports = {
    command: 'pomf',
    aliases: ['lain'],
    category: 'upload',
    description: 'Upload to Pomf.lain.la (1GB, permanent)',
    usage: '.pomf (reply to media)',
    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                await sock.sendMessage(chatId, { text: '⚠️ Please reply to media!' }, { quoted: message });
                return;
            }

            const type = Object.keys(quotedMsg)[0];
            const supportedTypes = ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage'];
            
            if (!supportedTypes.includes(type)) {
                await sock.sendMessage(chatId, { text: '⚠️ Unsupported type!' }, { quoted: message });
                return;
            }

            await sock.sendMessage(chatId, { text: 'Uploading to Pomf...' }, { quoted: message });

            const mediaType = type === 'stickerMessage' ? 'sticker' : type.replace('Message', '');
            const stream = await downloadContentFromMessage(quotedMsg[type], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            let ext = 'bin';
            if (type === 'imageMessage') ext = 'jpg';
            else if (type === 'videoMessage') ext = 'mp4';
            else if (type === 'stickerMessage') ext = 'webp';
            else if (quotedMsg[type].fileName) {
                ext = quotedMsg[type].fileName.split('.').pop() || 'bin';
            }

            const tempDir = path.join('./temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const tempPath = path.join(tempDir, `pomf_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result = await uploadToPomf2(tempPath);

            await sock.sendMessage(chatId, { 
                text: `✅ *Pomf Upload Success!*\n\n🔗 ${result.url}`
            }, { quoted: message });

            fs.unlinkSync(tempPath);

        } catch (error) {
            console.error('Pomf Error:', error);
            await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: message });
        }
    }
};
