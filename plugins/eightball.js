module.exports = {
  command: '8ball',
  aliases: ['eightball', 'magic8ball'],
  category: 'fun',
  description: 'Ask the magic 8-ball a question',
  usage: '.8ball Will I be rich?',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const question = args.join(' ');

      if (!question) {
        await sock.sendMessage(chatId, {
          text: '🎱 Please ask a question!'
        }, { quoted: message });
        return;
      }

      const eightBallResponses = [
        "Yes, definitely!",
        "No way!",
        "Ask again later.",
        "It is certain.",
        "Very doubtful.",
        "Without a doubt.",
        "My reply is no.",
        "Signs point to yes."
      ];

      const randomResponse =
        eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];

      await sock.sendMessage(chatId, {
        text: `🎱 *Question:* ${question}\n\n*Answer:* ${randomResponse}`
      }, { quoted: message });

    } catch (error) {
      console.error('Error in 8ball command:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Something went wrong with the magic 8-ball!'
      }, { quoted: message });
    }
  }
};
