const simpleGit = require('simple-git');

module.exports = {
  command: 'gitinfo',
  aliases: ['infogit'],
  category: 'owner',
  description: 'Show detailed git repository information',
  usage: '.gitinfo',
  ownerOnly: true,

  async handler(sock, message) {
    const chatId = message.key.remoteJid;
    const git = simpleGit();

    try {
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return sock.sendMessage(chatId, { text: '❌ This project is not a git repository.' });
      }

      const status = await git.status();
      const branch = status.current || 'unknown';
      const dirty = status.files.length > 0;

      const commitHash = (await git.revparse(['--short', 'HEAD'])).trim();

      const ahead = status.ahead;
      const behind = status.behind;

      const modifiedCount = status.files.length;
      
      const remotes = await git.getRemotes(true);
      const remoteText = remotes.length
        ? remotes.map(r => `• ${r.name}: ${r.refs.fetch}`).join('\n')
        : 'None';

      const warning = dirty ? '⚠️ Warning: Working tree has uncommitted changes!' : '';

      const text =
        `📦 *Git Repository Info*\n\n` +
        `🌿 Branch: ${branch}\n` +
        `🔖 Commit: ${commitHash}\n` +
        `🧼 Working tree: ${dirty ? 'Dirty' : 'Clean'}\n` +
        `${dirty ? warning + '\n\n' : ''}` +
        `📊 Ahead: ${ahead}, Behind: ${behind}\n` +
        `📁 Modified/Untracked files: ${modifiedCount}\n\n` +
        `🔗 Remotes:\n${remoteText}`;

      await sock.sendMessage(chatId, { text });

    } catch (err) {
      await sock.sendMessage(chatId, { text: `❌ Git error: ${err.message}` });
    }
  }
};
