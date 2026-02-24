const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { uploadToTmpfiles } = require('../lib/uploaders');

module.exports = {
    command: 'tmpfiles',
    aliases: ['tmpf', 'tfiles'],
    category: 'upload',
    description: 'Upload to Tmpfiles.org (temporary)',
    usage: '.tmpfiles (reply to media or caption on media)',
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

            await sock.sendMessage(chatId, { text: 'Uploading to Tmpfiles...' }, { quoted: message });

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

            const tempPath = path.join(tempDir, `tmpfiles_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result = await uploadToTmpfiles(tempPath);

            await sock.sendMessage(chatId, { 
                text: `✅ *Tmpfiles Upload Success!*\n\n🔗 Direct: ${result.url}\n📄 Page: ${result.page_url}`
            }, { quoted: message });

            fs.unlinkSync(tempPath);

        } catch (error) {
            console.error('Tmpfiles Error:', error);
            await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: message });
        }
    }
};
