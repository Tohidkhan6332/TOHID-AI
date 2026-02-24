const axios = require('axios');

module.exports = {
  command: 'scloud',
  aliases: ['scsearch', 'soundcloud'],
  category: 'music',
  description: 'Search for tracks on SoundCloud',
  usage: '.scloud <song name>',
  
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const searchQuery = args.join(' ').trim();

    try {
      if (!searchQuery) {
        return await sock.sendMessage(chatId, {
          text: "*What do you want to search on SoundCloud?*\nUsage: .soundcloud <song name>\n\nExample: .soundcloud never gonna give you up"
        }, { quoted: message });
      }

      await new Promise(resolve => setTimeout(resolve, 10000));

      const searchUrl = `https://discardapi.dpdns.org/api/search/soundcloud?apikey=guru&query=${encodeURIComponent(searchQuery)}`;
      const response = await axios.get(searchUrl, { timeout: 30000 });
      
      if (!response.data?.result?.result || response.data.result.result.length === 0) {
        return await sock.sendMessage(chatId, {
          text: "❌ *No results found!*\nTry a different search term."
        }, { quoted: message });
      }

      const results = response.data.result.result;
      const totalFound = results.length;

      const tracks = results.filter(item => item.kind === 'track');
      
      if (tracks.length === 0) {
        return await sock.sendMessage(chatId, {
          text: "❌ *No tracks found!*\nOnly found user profiles. Try searching for specific songs."
        }, { quoted: message });
      }

      const limit = Math.min(5, tracks.length);
      
      let resultText = `🎵 *SoundCloud Results*\n`;
      resultText += `📊 Found ${totalFound} results (${tracks.length} tracks)\n\n`;

      for (let i = 0; i < limit; i++) {
        const track = tracks[i];
        const duration = Math.floor(track.duration / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        resultText += `*${i + 1}. ${track.title}*\n`;
        resultText += `👤 Artist: ${track.user_id ? 'Available' : 'Unknown'}\n`;
        resultText += `⏱️ Duration: ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
        resultText += `👂 Plays: ${track.playback_count?.toLocaleString() || 'N/A'}\n`;
        resultText += `❤️ Likes: ${track.likes_count?.toLocaleString() || 'N/A'}\n`;
        resultText += `💬 Comments: ${track.comment_count?.toLocaleString() || 'N/A'}\n`;
        resultText += `🎼 Genre: ${track.genre || 'Unknown'}\n`;
        resultText += `🔗 Link: ${track.permalink_url}\n\n`;
      }

      if (tracks.length > limit) {
        resultText += `_+${tracks.length - limit} more tracks available_`;
      }

      const firstTrack = tracks[0];
      if (firstTrack.artwork_url) {
        try {
          const imageBuffer = await axios.get(firstTrack.artwork_url, { 
            responseType: 'arraybuffer',
            timeout: 15000 
          }).then(res => Buffer.from(res.data));

          await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: resultText
          }, { quoted: message });
        } catch (imgError) {
          await sock.sendMessage(chatId, {
            text: resultText
          }, { quoted: message });
        }
      } else {
        await sock.sendMessage(chatId, {
          text: resultText
        }, { quoted: message });
      }

    } catch (error) {
      console.error('SoundCloud Search Error:', error);
      
      let errorMsg = "❌ *Search failed!*\n\n";
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMsg += "*Reason:* Connection timeout\nThe API took too long to respond.";
      } else if (error.response) {
        errorMsg += `*Status:* ${error.response.status}\n*Error:* ${error.response.statusText}`;
      } else {
        errorMsg += `*Error:* ${error.message}`;
      }
      
      errorMsg += "\n\nPlease try again later.";

      await sock.sendMessage(chatId, {
        text: errorMsg
      }, { quoted: message });
    }
  }
};

