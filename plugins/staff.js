module.exports = {
  command: 'staff',
  aliases: ['admins', 'adminlist'],
  category: 'group',
  description: 'Display list of group admins',
  usage: '.staff',
  groupOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      
      let pp;
      try {
        pp = await sock.profilePictureUrl(chatId, 'image');
      } catch {
        pp = 'https://h.uguu.se/FFWblcPi.jpg';
      }
      
      const participants = groupMetadata.participants;
      const groupAdmins = participants.filter(p => p.admin);
      const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n▢ ');

      const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

      const text = `
≡ *GROUP ADMINS* _${groupMetadata.subject}_

┌─⊷ *ADMINS*
▢ ${listAdmin}
└───────────
`.trim();

      await sock.sendMessage(chatId, {
        image: { url: pp },
        caption: text,
        mentions: [...groupAdmins.map(v => v.id), owner],
        ...channelInfo
      });

    } catch (error) {
      console.error('Error in staff command:', error);
      await sock.sendMessage(chatId, { 
        text: 'Failed to get admin list!',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
