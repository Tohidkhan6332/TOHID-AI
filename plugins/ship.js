module.exports = {
  command: 'ship',
  aliases: ['couple'],
  category: 'group',
  description: 'Randomly ship two members in the group',
  usage: '.ship',
  groupOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      const participants = await sock.groupMetadata(chatId);
      const ps = participants.participants.map(v => v.id);
      
      let firstUser, secondUser;

      firstUser = ps[Math.floor(Math.random() * ps.length)];
      do {
        secondUser = ps[Math.floor(Math.random() * ps.length)];
      } while (secondUser === firstUser);

      const formatMention = id => '@' + id.split('@')[0];

      await sock.sendMessage(chatId, {
        text: `${formatMention(firstUser)} ❤️ ${formatMention(secondUser)}\nCongratulations 💖🍻`,
        mentions: [firstUser, secondUser],
        ...channelInfo
      });

    } catch (error) {
      console.error('Error in ship command:', error);
      await sock.sendMessage(chatId, { 
        text: '❌ Failed to ship! Make sure this is a group.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
