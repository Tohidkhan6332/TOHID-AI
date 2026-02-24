const axios = require('axios');

module.exports = {
  command: 'spotify',
  aliases: ['sp', 'spotifydl'],
  category: 'download',
  description: 'Download music from Spotify',
  usage: '.spotify <song/artist/keywords>',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      const query = args.join(' ');

      if (!query) {
        await sock.sendMessage(chatId, { 
          text: 'Usage: .spotify <song/artist/keywords>\nExample: .spotify con calma',
          ...channelInfo
        }, { quoted: message });
        return;
      }

      const apiUrl = `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl, { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0' } });

      if (!data?.status || !data?.result) {
        throw new Error('No result from Spotify API');
      }

      const r = data.result;
      const audioUrl = r.audio;
      
      if (!audioUrl) {
        await sock.sendMessage(chatId, { 
          text: 'No downloadable audio found for this query.',
          ...channelInfo
        }, { quoted: message });
        return;
      }

      const caption = `🎵 ${r.title || r.name || 'Unknown Title'}\n👤 ${r.artist || ''}\n⏱ ${r.duration || ''}\n🔗 ${r.url || ''}`.trim();

      if (r.thumbnails) {
        await sock.sendMessage(chatId, { 
          image: { url: r.thumbnails }, 
          caption,
          ...channelInfo
        }, { quoted: message });
      } else if (caption) {
        await sock.sendMessage(chatId, { 
          text: caption,
          ...channelInfo
        }, { quoted: message });
      }
      
      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: `${(r.title || r.name || 'track').replace(/[\\/:*?"<>|]/g, '')}.mp3`,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('[SPOTIFY] error:', error?.message || error);
      await sock.sendMessage(chatId, { 
        text: 'Failed to fetch Spotify audio. Try another query later.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
