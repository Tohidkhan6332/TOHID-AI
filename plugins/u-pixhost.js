const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { uploadToPixhost } = require('../lib/uploaders');

module.exports = {
    command: 'pixhost',
    aliases: ['ph', 'pix'],
    category: 'upload',
    description: 'Upload to Pixhost (images only)',
    usage: '.pixhost (reply to media or caption on media)',
    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            const hasMedia = message.message?.imageMessage || 
                           message.message?.videoMessage || 
                           message.message?.stickerMessage || 
                           message.message?.documentMessage;
            
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!hasMedia && !quotedMsg) {
                await sock.sendMessage(chatId, { text: '⚠️ Please send media with caption or reply to media!' }, { quoted: message });
                return;
            }

            const mediaSource = hasMedia ? message.message : quotedMsg;
            const type = Object.keys(mediaSource).find(key => 
                ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage'].includes(key)
            );

            if (!type) {
                await sock.sendMessage(chatId, { text: '⚠️ Unsupported media type!' }, { quoted: message });
                return;
            }

            await sock.sendMessage(chatId, { text: 'Uploading to Pixhost...' }, { quoted: message });

            const mediaType = type === 'stickerMessage' ? 'sticker' : type.replace('Message', '');
            const stream = await downloadContentFromMessage(mediaSource[type], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            let ext = 'bin';
            if (type === 'imageMessage') ext = 'jpg';
            else if (type === 'videoMessage') ext = 'mp4';
            else if (type === 'stickerMessage') ext = 'webp';
            else if (mediaSource[type].fileName) {
                ext = mediaSource[type].fileName.split('.').pop() || 'bin';
            }

            const tempDir = path.join('./temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const tempPath = path.join(tempDir, `pixhost_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result = await uploadToPixhost(tempPath);

            await sock.sendMessage(chatId, { 
                text: `✅ *Pixhost Upload Success!*\n\n🔗 ${result.url}`
            }, { quoted: message });

            fs.unlinkSync(tempPath);

        } catch (error) {
            console.error('Pixhost Error:', error);
            await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: message });
        }
    }
};
