const { setAntistatus, getAntistatus, removeAntistatus } = require('../lib/index');

async function handleStatusDetection(sock, chatId, message, senderId) {
    try {
        const antistatusSetting = await getAntistatus(chatId, 'on');
        if (!antistatusSetting || !antistatusSetting.enabled) return;

        // Check if message contains a status mention
        const messageText = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            ''
        );

        // Check for status mentions pattern (@status or @status mentions)
        const statusMentionPattern = /@status|@Status|@STATUS|@\d{10,}\s+status|status\s+@\d{10,}/gi;
        const hasStatusMention = statusMentionPattern.test(messageText);

        // Check context info for status mentions
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        const isStatusMention = contextInfo?.mentionedJid?.some(jid => 
            jid.includes('status') || messageText.toLowerCase().includes('@status')
        );

        // Check for common status mention patterns
        const statusVariations = [
            'status', 'update', 'story', 'status update',
            'view status', 'check status', 'status dekho'
        ];
        
        const hasStatusKeywords = statusVariations.some(keyword => 
            messageText.toLowerCase().includes(keyword)
        ) && (messageText.includes('@') || contextInfo?.mentionedJid?.length > 0);

        // Check for specific status mention format
        const explicitStatusMention = /@(?:\d{10,})\s+status|status\s+@(?:\d{10,})/i.test(messageText);

        if (hasStatusMention || isStatusMention || hasStatusKeywords || explicitStatusMention) {
            const action = antistatusSetting.action || 'delete';
            
            if (action === 'delete') {
                // Delete the message
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: message.key.id,
                        participant: senderId
                    }
                });
                
                // Send warning
                await sock.sendMessage(chatId, {
                    text: `⚠️ *Status Mention Detected!*\n\n@${senderId.split('@')[0]}, mentioning status is not allowed in this group.`,
                    mentions: [senderId]
                });
                
            } else if (action === 'warn') {
                // Just warn without deleting (if action is warn)
                await sock.sendMessage(chatId, {
                    text: `⚠️ *Warning!*\n\n@${senderId.split('@')[0]}, please do not mention status in this group.`,
                    mentions: [senderId]
                });
                
            } else if (action === 'strict') {
                // Delete and warn strictly
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: message.key.id,
                        participant: senderId
                    }
                });
                
                await sock.sendMessage(chatId, {
                    text: `🚫 *Status Mention Blocked!*\n\n@${senderId.split('@')[0]}, mentioning status is strictly prohibited in this group.`,
                    mentions: [senderId]
                });
            }
        }
    } catch (error) {
        console.error('Error in status detection:', error);
    }
}

module.exports = {
    command: 'antistatus',
    aliases: ['as', 'statusblock', 'nostatus'],
    category: 'admin',
    description: 'Prevent users from mentioning status in group',
    usage: '.antistatus <on|off|set>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            const config = await getAntistatus(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: `*📱 TOHID-AI ANTISTATUS SETUP*\n\n` +
                      `*Current Status:* ${config?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                      `*Current Action:* ${config?.action || 'Not set'}\n\n` +
                      `*Commands:*\n` +
                      `• \`.antistatus on\` - Enable\n` +
                      `• \`.antistatus off\` - Disable\n` +
                      `• \`.antistatus set delete\` - Delete status mention messages\n` +
                      `• \`.antistatus set warn\` - Only warn without deleting\n` +
                      `• \`.antistatus set strict\` - Delete and strict warning\n\n` +
                      `*Detection Patterns:*\n` +
                      `• @status mentions\n` +
                      `• Status update requests\n` +
                      `• Story/view status mentions\n` +
                      `• @number status mentions\n\n` +
                      `*Protects group from:*\n` +
                      `• Status spam\n` +
                      `• Unwanted status promotion\n` +
                      `• Status tagging abuse`
            }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntistatus(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '⚠️ *Antistatus is already enabled*'
                    }, { quoted: message });
                    return;
                }
                const result = await setAntistatus(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result 
                        ? '✅ *Antistatus enabled successfully!*\n\nDefault action: Delete status mention messages' 
                        : '❌ *Failed to enable antistatus*'
                }, { quoted: message });
                break;

            case 'off':
                await removeAntistatus(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: '❌ *Antistatus disabled*\n\nUsers can now mention status in the group.'
                }, { quoted: message });
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Please specify an action*\n\nUsage: `.antistatus set delete | warn | strict`'
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1].toLowerCase();
                if (!['delete', 'warn', 'strict'].includes(setAction)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Invalid action*\n\nChoose: delete, warn, or strict'
                    }, { quoted: message });
                    return;
                }
                const setResult = await setAntistatus(chatId, 'on', setAction);
                
                const actionDescriptions = {
                    delete: 'Delete status mention messages and warn users',
                    warn: 'Only warn users without deleting messages',
                    strict: 'Delete messages and give strict warnings'
                };
                
                await sock.sendMessage(chatId, {
                    text: setResult 
                        ? `✅ *Antistatus action set to: ${setAction}*\n\n${actionDescriptions[setAction]}`
                        : '❌ *Failed to set antistatus action*'
                }, { quoted: message });
                break;

            case 'status':
            case 'get':
                const status = await getAntistatus(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: `*📱 TOHID-AI ANTISTATUS STATUS*\n\n` +
                          `*Status:* ${status?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                          `*Action:* ${status?.action || 'Not set'}\n\n` +
                          `*What happens when status mention is detected:*\n` +
                          `${status?.action === 'delete' ? '• Message is deleted\n• User gets warning' : ''}` +
                          `${status?.action === 'warn' ? '• User gets warning\n• Message remains' : ''}` +
                          `${status?.action === 'strict' ? '• Message is deleted\n• User gets strict warning' : ''}\n\n` +
                          `*Detected patterns:*\n` +
                          `• @status mentions\n` +
                          `• Status update requests\n` +
                          `• Story/view status mentions\n` +
                          `• Status tagging with numbers`
                }, { quoted: message });
                break;

            default:
                await sock.sendMessage(chatId, {
                    text: '❌ *Invalid command*\n\nUse `.antistatus` to see available options.'
                }, { quoted: message });
        }
    },

    handleStatusDetection
};