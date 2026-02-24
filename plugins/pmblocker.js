const fs = require('fs');
const store = require('../lib/lightweight_store');

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

const PMBLOCKER_PATH = './data/pmblocker.json';

const DEFAULT_MESSAGE = '⚠️ Direct messages are blocked!\nYou cannot DM this bot. Please contact the owner in group chats only.';

async function readState() {
    try {
        if (HAS_DB) {
            const data = await store.getSetting('global', 'pmblocker');
            if (!data) {
                return { enabled: false, message: DEFAULT_MESSAGE };
            }
            return {
                enabled: !!data.enabled,
                message: typeof data.message === 'string' && data.message.trim() 
                    ? data.message 
                    : DEFAULT_MESSAGE
            };
        } else {
            if (!fs.existsSync(PMBLOCKER_PATH)) {
                return { enabled: false, message: DEFAULT_MESSAGE };
            }
            const raw = fs.readFileSync(PMBLOCKER_PATH, 'utf8');
            const data = JSON.parse(raw || '{}');
            return {
                enabled: !!data.enabled,
                message: typeof data.message === 'string' && data.message.trim() 
                    ? data.message 
                    : DEFAULT_MESSAGE
            };
        }
    } catch {
        return { enabled: false, message: DEFAULT_MESSAGE };
    }
}

async function writeState(enabled, message) {
    try {
        const current = await readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        
        if (HAS_DB) {
            await store.saveSetting('global', 'pmblocker', payload);
        } else {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            fs.writeFileSync(PMBLOCKER_PATH, JSON.stringify(payload, null, 2));
        }
    } catch (e) {
        console.error('Error writing PM blocker state:', e);
    }
}

module.exports = {
    command: 'pmblocker',
    aliases: ['pmblock', 'blockpm', 'antipm'],
    category: 'owner',
    description: 'Block private messages and auto-block users who DM the bot',
    usage: '.pmblocker <on|off|status|setmsg>',
    ownerOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const state = await readState();
        
        const sub = args[0]?.toLowerCase();
        const rest = args.slice(1);

        if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub)) {
            await sock.sendMessage(chatId, {
                text: `📵 *PM BLOCKER*\n\n` +
                      `*Storage:* ${HAS_DB ? 'Database' : 'File System'}\n\n` +
                      `*Commands:*\n` +
                      `• \`.pmblocker on\` - Enable DM blocking\n` +
                      `• \`.pmblocker off\` - Disable DM blocking\n` +
                      `• \`.pmblocker status\` - Current status\n` +
                      `• \`.pmblocker setmsg <text>\` - Set warning message\n\n` +
                      `*Current Status:* ${state.enabled ? '✅ ENABLED' : '❌ DISABLED'}`
            }, { quoted: message });
            return;
        }

        if (sub === 'status') {
            await sock.sendMessage(chatId, {
                text: `📵 *PM BLOCKER STATUS*\n\n` +
                      `*Status:* ${state.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
                      `*Storage:* ${HAS_DB ? 'Database' : 'File System'}\n\n` +
                      `*Warning Message:*\n${state.message}`
            }, { quoted: message });
            return;
        }

        if (sub === 'setmsg') {
            const newMsg = rest.join(' ').trim();
            if (!newMsg) {
                await sock.sendMessage(chatId, {
                    text: '*Please provide a message*\n\nUsage: `.pmblocker setmsg <your message>`'
                }, { quoted: message });
                return;
            }
            await writeState(state.enabled, newMsg);
            await sock.sendMessage(chatId, {
                text: `✅ *PM blocker message updated!*\n\n*New message:*\n${newMsg}`
            }, { quoted: message });
            return;
        }

        const enable = sub === 'on';
        await writeState(enable);
        
        await sock.sendMessage(chatId, {
            text: `📵 *PM Blocker ${enable ? 'ENABLED' : 'DISABLED'}*\n\n` +
                  `${enable ? '✅ Users who DM the bot will be warned and blocked.' : '❌ Private messages are now allowed.'}`
        }, { quoted: message });
    },

    readState,
    writeState
};


