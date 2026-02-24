const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { uploadToFreeimage } = require('../lib/uploaders');

module.exports = {
    command: 'freeimage',
    aliases: ['fimg', 'freeimg'],
    category: 'upload',
    description: 'Upload to Freeimage.host',
    usage: '.freeimage (reply to image)',
    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                await sock.sendMessage(chatId, { text: '⚠️ Please reply to an image!' }, { quoted: message });
                return;
            }

            await sock.sendMessage(chatId, { text: 'Uploading to Freeimage...' }, { quoted: message });

            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempDir = path.join('./temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const tempPath = path.join(tempDir, `freeimage_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, buffer);

            const result = await uploadToFreeimage(tempPath);

            await sock.sendMessage(chatId, { 
                text: `✅ *Freeimage Upload Success!*\n\n` +
                      `🔗 *URL:* ${result.url}\n` +
                      `🖼️ *Display:* ${result.display_url}\n` +
                      `🗑️ *Delete:* ${result.delete_url}`
            }, { quoted: message });

            fs.unlinkSync(tempPath);

        } catch (error) {
            console.error('Freeimage Error:', error);
            await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: message });
        }
    }
};
