module.exports = {
  command: 'unmute',
  aliases: ['unsilence'],
  category: 'admin',
  description: 'Unmute the group',
  usage: '.unmute',
  groupOnly: true,
  adminOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      await sock.sendMessage(chatId, { 
        text: 'The group has been unmuted.',
        ...channelInfo
      }, { quoted: message });
    } catch (error) {
      console.error('Error unmuting group:', error);
      await sock.sendMessage(chatId, { 
        text: 'Failed to unmute the group.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
