
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const store = require('./lightweight_store');
const commandHandler = require('./commandHandler');
const { printMessage, printLog } = require('./print');
const { isBanned } = require('./isBanned');
const { isSudo } = require('./index');
const isOwnerOrSudo = require('./isOwner');
const isAdmin = require('./isAdmin');
const { handleAutoread } = require('../plugins/autoread');
const { handleAutotypingForMessage, showTypingAfterCommand } = require('../plugins/autotyping');
const { storeMessage, handleMessageRevocation } = require('../plugins/antidelete');
const { handleBadwordDetection } = require('./antibadword');
const { handleLinkDetection } = require('../plugins/antilink');
const { handleTagDetection } = require('../plugins/antitag');
const { handleMentionDetection } = require('../plugins/mention');
const { handleChatbotResponse } = require('../plugins/chatbot');
const { handleTicTacToeMove } = require('../plugins/tictactoe');
const { addCommandReaction } = require('./reactions');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363207624903731@newsletter',
            newsletterName: '𝐓𝐎𝐇𝐈𝐃-𝐀𝐈',
            serverMessageId: -1
        }
    }
};

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const STICKER_FILE = path.join(__dirname, '../data/sticker_commands.json');

async function getStickerCommands() {
    if (HAS_DB) {
        const data = await store.getSetting('global', 'stickerCommands');
        return data || {};
    } else {
        try {
            if (!fs.existsSync(STICKER_FILE)) {
                return {};
            }
            return JSON.parse(fs.readFileSync(STICKER_FILE, 'utf8'));
        } catch {
            return {};
        }
    }
}

async function handleMessages(sock, messageUpdate) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        await printMessage(message, sock);
        
        try {
            const ghostMode = await store.getSetting('global', 'stealthMode');
            if (!ghostMode || !ghostMode.enabled) {
                await handleAutoread(sock, message);
            } else {
                printLog('info', '👻 Stealth mode active');
            }
        } catch (err) {
            await handleAutoread(sock, message);
        }

        const chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        if (message.message?.protocolMessage?.type === 0) {
            printLog('info', 'Message deletion detected');
            await handleMessageRevocation(sock, message);
            return;
        }

        await storeMessage(sock, message);

        const senderId = message.key.participant || message.key.remoteJid;

        if (message.message?.stickerMessage) {
            const fileSha256 = message.message.stickerMessage.fileSha256;
            if (fileSha256) {
                const hash = Buffer.from(fileSha256).toString('base64');
                const stickers = await getStickerCommands();
                
                if (stickers[hash]) {
                    printLog('info', `🎨 Sticker command detected: ${stickers[hash].text}`);
                    
                    const commandText = stickers[hash].text;
                    const [cmdName, ...cmdArgs] = commandText.split(' ');
                    
                    let foundCommand = null;
                    let usedPrefix = '';
                    
                    for (const prefix of settings.prefixes) {
                        const testCmd = (prefix + cmdName).toLowerCase();
                        foundCommand = commandHandler.getCommand(testCmd, settings.prefixes);
                        if (foundCommand) {
                            usedPrefix = prefix;
                            break;
                        }
                    }
                    
                    if (foundCommand) {
                        const senderIsSudo = await isSudo(senderId);
                        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
                        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;

                        const botMode = await store.getBotMode();
                        const isAllowed = (() => {
                            if (isOwnerOrSudoCheck) return true;
                            
                            switch (botMode) {
                                case 'public':
                                    return true;
                                case 'private':
                                case 'self':
                                    return false;
                                case 'groups':
                                    return isGroup;
                                case 'inbox':
                                    return !isGroup;
                                default:
                                    return true;
                            }
                        })();

                        if (!isAllowed) return;

                        const userBanned = await isBanned(senderId);
                        if (userBanned) return;

                        if (foundCommand.strictOwnerOnly) {
                            const { isOwnerOnly } = require('./isOwner');
                            if (!message.key.fromMe && !isOwnerOnly(senderId)) {
                                return await sock.sendMessage(chatId, { 
                                    text: '❌ This command is only available for the bot owner!',
                                    ...channelInfo 
                                }, { quoted: message });
                            }
                        }

                        if (foundCommand.ownerOnly && !message.key.fromMe && !senderIsOwnerOrSudo) {
                            return await sock.sendMessage(chatId, { 
                                text: '❌ This command is only available for the owner or sudo users!',
                                ...channelInfo 
                            }, { quoted: message });
                        }

                        if (foundCommand.groupOnly && !isGroup) {
                            return await sock.sendMessage(chatId, { 
                                text: 'This command can only be used in groups!',
                                ...channelInfo 
                            }, { quoted: message });
                        }

                        let isSenderAdmin = false;
                        let isBotAdmin = false;

                        if (foundCommand.adminOnly && isGroup) {
                            const adminStatus = await isAdmin(sock, chatId, senderId);
                            isSenderAdmin = adminStatus.isSenderAdmin;
                            isBotAdmin = adminStatus.isBotAdmin;

                            if (!isBotAdmin) {
                                return await sock.sendMessage(chatId, { 
                                    text: '❌ Please make the bot an admin to use this command.',
                                    ...channelInfo 
                                }, { quoted: message });
                            }

                            if (!isSenderAdmin && !message.key.fromMe && !senderIsOwnerOrSudo) {
                                return await sock.sendMessage(chatId, {
                                    text: '❌ Sorry, only group admins can use this command.',
                                    ...channelInfo
                                }, { quoted: message });
                            }
                        }

                        const syntheticMessage = {
                            key: message.key,
                            message: {
                                extendedTextMessage: {
                                    text: usedPrefix + commandText,
                                    contextInfo: message.message.stickerMessage.contextInfo || {}
                                }
                            },
                            messageTimestamp: message.messageTimestamp,
                            pushName: message.pushName,
                            broadcast: message.broadcast
                        };

                        const context = {
                            chatId,
                            senderId,
                            isGroup,
                            isSenderAdmin,
                            isBotAdmin,
                            senderIsOwnerOrSudo,
                            isOwnerOrSudoCheck,
                            channelInfo,
                            rawText: usedPrefix + commandText,
                            userMessage: (usedPrefix + commandText).toLowerCase(),
                            messageText: usedPrefix + commandText
                        };

                        try {
                            await foundCommand.handler(sock, syntheticMessage, cmdArgs, context);
                            await addCommandReaction(sock, message);
                            await showTypingAfterCommand(sock, chatId);
                            printLog('success', `✅ Sticker command executed: ${commandText}`);
                        } catch (error) {
                            printLog('error', `❌ Sticker command error [${commandText}]: ${error.message}`);
                            console.error(error.stack);
                            await sock.sendMessage(chatId, {
                                text: `❌ Error executing sticker command: ${error.message}`,
                                ...channelInfo
                            }, { quoted: message });
                        }
                    } else {
                        printLog('warning', `⚠️ Sticker command not found: ${commandText}`);
                    }
                    
                    return;
                }
            }
        }

        const rawText = 
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            message.message?.buttonsResponseMessage?.selectedButtonId ||
            '';

        const messageText = rawText.trim();
        const userMessage = messageText.toLowerCase();

        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;

        if (senderIsOwnerOrSudo) {
            printLog('info', `Owner/Sudo detected: ${senderId.split('@')[0]}`);
        }

        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            printLog('info', `Button response: ${buttonId}`);
            
            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, { 
                    text: '*Join our Channel:*\n[https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T](https://chat.whatsapp.com/HUEyTVIQ7Ij1gFs6aZkbMk)' 
                }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('../plugins/owner');
                await ownerCommand(sock, chatId);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, { 
                    text: `*Support*\n\nhttps://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T` 
                }, { quoted: message });
                return;
            }
        }

        const userBanned = await isBanned(senderId);
        if (userBanned && !userMessage.startsWith('.unban')) {
            if (Math.random() < 0.1) {
                printLog('warning', `Banned user attempted command: ${senderId.split('@')[0]}`);
                await sock.sendMessage(chatId, {
                    text: 'You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        if (/^[1-9]$/.test(userMessage) || userMessage === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (!message.key.fromMe) {
            await store.incrementMessageCount(chatId, senderId);
        }

        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            await handleLinkDetection(sock, chatId, message, userMessage, senderId);
        }

        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const { readState: readPmBlockerState } = require('../plugins/pmblocker');
                const pmState = await readPmBlockerState();
                if (pmState.enabled) {
                    printLog('warning', `PM blocked from: ${senderId.split('@')[0]}`);
                    await sock.sendMessage(chatId, { 
                        text: pmState.message || 'Private messages are blocked. Please contact the owner in groups only.' 
                    });
                    await new Promise(r => setTimeout(r, 1500));
                    try { 
                        await sock.updateBlockStatus(chatId, 'block');
                        printLog('success', `Blocked user: ${senderId.split('@')[0]}`);
                    } catch (e) {
                        printLog('error', `Failed to block user: ${e.message}`);
                    }
                    return;
                }
            } catch (e) {
                printLog('error', `PM blocker error: ${e.message}`);
            }
        }

        const usedPrefix = settings.prefixes.find(p => userMessage.startsWith(p));

        const command = commandHandler.getCommand(userMessage, settings.prefixes);

        if (!usedPrefix && !command) {
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                
                const botMode = await store.getBotMode();
                const canUseChatbot = botMode === 'public' || 
                                     (botMode === 'groups' && isGroup) || 
                                     (botMode === 'inbox' && !isGroup) ||
                                     isOwnerOrSudoCheck;
                
                if (canUseChatbot) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }

        if (!command) {
            if (isGroup) {
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                const botMode = await store.getBotMode();
                const canUseChatbot = botMode === 'public' || 
                                     (botMode === 'groups' && isGroup) || 
                                     (botMode === 'inbox' && !isGroup) ||
                                     isOwnerOrSudoCheck;
                
                if (canUseChatbot) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }

        const botMode = await store.getBotMode();
        const isAllowed = (() => {
            if (isOwnerOrSudoCheck) return true;
            
            switch (botMode) {
                case 'public':
                    return true;
                case 'private':
                case 'self':
                    return false;
                case 'groups':
                    return isGroup;
                case 'inbox':
                    return !isGroup;
                default:
                    return true;
            }
        })();

        if (!isAllowed) {
            return;
        }

        let args;
        if (usedPrefix) {
            const originalCommandText = messageText.slice(usedPrefix.length).trim();
            args = originalCommandText.split(/\s+/).slice(1);
        } else {
            args = messageText.trim().split(/\s+/).slice(1);
        }

        if (command.strictOwnerOnly) {
            const { isOwnerOnly } = require('./isOwner');
            if (!message.key.fromMe && !isOwnerOnly(senderId)) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ This command is only available for the bot owner!\n\n_Sudo users cannot manage other sudo users._',
                    ...channelInfo 
                }, { quoted: message });
            }
        }

        if (command.ownerOnly && !message.key.fromMe && !senderIsOwnerOrSudo) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command is only available for the owner or sudo users!',
                ...channelInfo 
            }, { quoted: message });
        }

        if (command.groupOnly && !isGroup) {
            return await sock.sendMessage(chatId, { 
                text: 'This command can only be used in groups!',
                ...channelInfo 
            }, { quoted: message });
        }
        
        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (command.adminOnly && isGroup) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Please make the bot an admin to use this command.',
                    ...channelInfo 
                }, { quoted: message });
            }

            if (!isSenderAdmin && !message.key.fromMe && !senderIsOwnerOrSudo) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Sorry, only group admins can use this command.',
                    ...channelInfo
                }, { quoted: message });
            }
        }

        const context = {
            chatId,
            senderId,
            isGroup,
            isSenderAdmin,
            isBotAdmin,
            senderIsOwnerOrSudo,
            isOwnerOrSudoCheck,
            channelInfo,
            rawText,
            userMessage,
            messageText
        };

        try {
            await command.handler(sock, message, args, context);
            await addCommandReaction(sock, message);
            await showTypingAfterCommand(sock, chatId);
        } catch (error) {
            printLog('error', `Command error [${command.command}]: ${error.message}`);
            console.error(error.stack);
            
            await sock.sendMessage(chatId, {
                text: `❌ Error executing command: ${error.message}`,
                ...channelInfo
            }, { quoted: message });

            const errorLog = {
                command: command.command,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                user: senderId,
                chat: chatId
            };
            
            try {
                fs.appendFileSync('./error.log', JSON.stringify(errorLog) + '\n');
                printLog('info', 'Error logged to file');
            } catch (e) {
                printLog('error', `Failed to write error log: ${e.message}`);
            }
        }

    } catch (error) {
        printLog('error', `Message handler error: ${error.message}`);
        console.error(error.stack);
        
        const chatId = messageUpdate.messages?.[0]?.key?.remoteJid;
        if (chatId) {
            try {
                await sock.sendMessage(chatId, {
                    text: '❌ Failed to process message!',
                    ...channelInfo
                });
            } catch (e) {
                printLog('error', `Failed to send error message: ${e.message}`);
            }
        }
    }
 }


async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;

        printLog('info', `Group update: ${action} in ${id.split('@')[0]}`);

        const botMode = await store.getBotMode();
        const isPublicMode = botMode === 'public' || botMode === 'groups';

        switch (action) {
            case 'promote':
                if (!isPublicMode) return;
                if (participants && participants.length > 0) {
                    const participant = Array.isArray(participants) ? participants[0] : participants;
                    printLog('success', `User promoted: ${typeof participant === 'string' ? participant.split('@')[0] : 'unknown'}`);
                }
                const { handlePromotionEvent } = require('../plugins/promote');
                await handlePromotionEvent(sock, id, participants, author);
                break;

            case 'demote':
                if (!isPublicMode) return;
                if (participants && participants.length > 0) {
                    const participant = Array.isArray(participants) ? participants[0] : participants;
                    printLog('warning', `User demoted: ${typeof participant === 'string' ? participant.split('@')[0] : 'unknown'}`);
                }
                const { handleDemotionEvent } = require('../plugins/demote');
                await handleDemotionEvent(sock, id, participants, author);
                break;

            case 'add':
                if (participants && participants.length > 0) {
                    const participant = Array.isArray(participants) ? participants[0] : participants;
                    printLog('success', `User joined: ${typeof participant === 'string' ? participant.split('@')[0] : 'unknown'}`);
                }
                const { handleJoinEvent } = require('../plugins/welcome');
                await handleJoinEvent(sock, id, participants);
                break;

            case 'remove':
                if (participants && participants.length > 0) {
                    const participant = Array.isArray(participants) ? participants[0] : participants;
                    printLog('info', `User left: ${typeof participant === 'string' ? participant.split('@')[0] : 'unknown'}`);
                }
                const { handleLeaveEvent } = require('../plugins/goodbye');
                await handleLeaveEvent(sock, id, participants);
                break;

            default:
                printLog('warning', `Unhandled group action: ${action}`);
        }
    } catch (error) {
        printLog('error', `Group update error: ${error.message}`);
        console.error(error.stack);
    }
}

async function handleStatus(sock, status) {
    try {
        const { handleStatusUpdate } = require('../plugins/autostatus');
        await handleStatusUpdate(sock, status);
    } catch (error) {
        printLog('error', `Status handler error: ${error.message}`);
        console.error(error.stack);
    }
}

async function handleCall(sock, calls) {
    try {
        const anticallPlugin = require('../plugins/anticall');
        const state = anticallPlugin.readState ? await anticallPlugin.readState() : { enabled: false };
        if (!state.enabled) return;

        const antiCallNotified = new Set();

        for (const call of calls) {
            const callerJid = call.from || call.peerJid || call.chatId;
            if (!callerJid) continue;

            printLog('warning', `Incoming call from: ${callerJid.split('@')[0]}`);

            try {
                try {
                    if (typeof sock.rejectCall === 'function' && call.id) {
                        await sock.rejectCall(call.id, callerJid);
                        printLog('success', `Call rejected: ${callerJid.split('@')[0]}`);
                    } else if (typeof sock.sendCallOfferAck === 'function' && call.id) {
                        await sock.sendCallOfferAck(call.id, callerJid, 'reject');
                        printLog('success', `Call rejected: ${callerJid.split('@')[0]}`);
                    }
                } catch (e) {
                    printLog('error', `Error rejecting call: ${e.message}`);
                }

                if (!antiCallNotified.has(callerJid)) {
                    antiCallNotified.add(callerJid);
                    setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                    
                    await sock.sendMessage(callerJid, { 
                        text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' 
                    });
                    printLog('info', `Sent anticall warning to: ${callerJid.split('@')[0]}`);
                }

                setTimeout(async () => {
                    try { 
                        await sock.updateBlockStatus(callerJid, 'block');
                        printLog('success', `Blocked caller: ${callerJid.split('@')[0]}`);
                    } catch (e) {
                        printLog('error', `Error blocking caller: ${e.message}`);
                    }
                }, 800);

            } catch (error) {
                printLog('error', `Error handling call from ${callerJid.split('@')[0]}: ${error.message}`);
            }
        }
    } catch (error) {
        printLog('error', `Call handler error: ${error.message}`);
        console.error(error.stack);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus,
    handleCall
};

