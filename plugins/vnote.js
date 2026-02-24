/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/


const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: 'vnote',
    aliases: ['voicenote', 'vn'],
    category: 'tools',
    description: 'Convert any audio message into a live-looking voice note',
    usage: 'Reply to an audio file with .vnote',

    async handler(sock, message, args, context = {}) {
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || chatId;

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.audioMessage) {
            return sock.sendMessage(chatId, { text: "Please reply to an *audio file* to convert it to a PTT." }, { quoted: message });
        }

        try {
            const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            await sock.sendMessage(chatId, { 
                audio: buffer, 
                ptt: true, 
                mimetype: 'audio/ogg; codecs=opus' 
            }, { quoted: message });

        } catch (error) {
            console.error('PTT Conversion Error:', error);
            await sock.sendMessage(chatId, { text: "❌ Failed to convert audio to voice note." });
        }
    }
};

/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/
