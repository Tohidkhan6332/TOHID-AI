const path = require('path');
const fs = require('fs');

module.exports = {
  command: 'ping',
  aliases: ['p', 'pong'],
  category: 'general',
  description: 'Check bot response time',
  usage: '.ping',
  isPrefixless: true,
  
  async handler(sock, message, args) {
    try {
      const start = Date.now();
      const chatId = message.key.remoteJid;
      const imagePath = path.join(__dirname, '../assets/tohid1.jpg');
      
      // Newsletter info for forwarding
      const newsletterInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363207624903731@newsletter',
          newsletterName: '𝐓𝐎𝐇𝐈𝐃-𝐀𝐈',
          serverMessageId: Date.now() // Using timestamp as serverMessageId
        }
      };
      
      // Check if image exists
      let sent;
      if (fs.existsSync(imagePath)) {
        // Send with image and newsletter context
        const imageBuffer = fs.readFileSync(imagePath);
        sent = await sock.sendMessage(chatId, { 
          image: imageBuffer,
          caption: '⚡ *Pinging...*',
          contextInfo: newsletterInfo
        });
      } else {
        // Fallback to text if image doesn't exist
        sent = await sock.sendMessage(chatId, { 
          text: '⚡ *Pinging...*',
          contextInfo: newsletterInfo
        });
      }
      
      const end = Date.now();
      const latency = end - start;
      
      // Format latency with color indicators
      let latencyEmoji = '🟢'; // Good
      if (latency > 500) latencyEmoji = '🟡'; // Medium
      if (latency > 1000) latencyEmoji = '🔴'; // Slow
      
      const responseText = `🏓 *PONG!*\n\n${latencyEmoji} *Latency:* ${latency}ms\n⏱️ *Response Time:* ${latency}ms\n🤖 *Bot Status:* Online\n\n📢 *Via: ${newsletterInfo.forwardedNewsletterMessageInfo.newsletterName}*`;
      
      // Edit or send response
      if (fs.existsSync(imagePath)) {
        // For image messages, send a new text message with newsletter context
        await sock.sendMessage(chatId, {
          text: responseText,
          contextInfo: newsletterInfo
        });
      } else {
        // Edit text message with newsletter context
        await sock.sendMessage(chatId, {
          text: responseText,
          edit: sent.key,
          contextInfo: newsletterInfo
        });
      }
      
    } catch (error) {
      console.error('Ping command error:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: '❌ An error occurred while checking ping.',
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363207624903731@newsletter',
            newsletterName: '𝐓𝐎𝐇𝐈𝐃-𝐀𝐈',
            serverMessageId: Date.now()
          }
        }
      });
    }
  }
};