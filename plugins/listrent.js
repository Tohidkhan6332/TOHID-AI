/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/


const store = require('../lib/lightweight_store');

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);


async function getAllCloneSessions() {
    if (HAS_DB) {
        const settings = await store.getAllSettings('clones') || {};
        return Object.entries(settings)
            .filter(([key, value]) => value && value.status)
            .map(([authId, data]) => ({ authId, ...data }));
    } else {
        const fs = require('fs');
        const path = require('path');
        const clonesDir = path.join(process.cwd(), 'session', 'clones');
        if (!fs.existsSync(clonesDir)) return [];
        
        const dirs = fs.readdirSync(clonesDir);
        return dirs.map(authId => {
            const sessionPath = path.join(clonesDir, authId, 'session.json');
            if (fs.existsSync(sessionPath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
                    return { authId, ...data };
                } catch (e) {
                    return { authId, status: 'unknown' };
                }
            }
            return { authId, status: 'unknown' };
        });
    }
}

module.exports = {
    command: 'listrent',
    aliases: ['listclone', 'botclones'],
    category: 'owner',
    description: 'List all currently active sub-bots',
    usage: '.listrent',

    async handler(sock, message, args, context = {}) {
        const { chatId } = context;

        const activeConns = global.conns || [];
        const storedClones = await getAllCloneSessions();

        if (activeConns.length === 0 && storedClones.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: "*❌ No sub-bots are currently active or stored.*" 
            }, { quoted: message });
        }

        let msg = `*─── [ TOHID-AI CLONE BOTS ] ───*\n\n`;
        msg += `*Storage:* ${HAS_DB ? 'Database 🗄️' : 'File System 📁'}\n\n`;

        if (activeConns.length > 0) {
            msg += `*🟢 ONLINE CLONES:*\n\n`;
            
            activeConns.forEach((conn, i) => {
                const user = conn.user;
                msg += `*${i + 1}.* @${user.id.split(':')[0]}\n`;
                msg += `   └ Name: ${user.name || 'Sub-Bot'}\n`;
                msg += `   └ Status: Connected ✅\n\n`;
            });
        }

        if (HAS_DB && storedClones.length > 0) {
            const offlineClones = storedClones.filter(clone => {
                return !activeConns.some(conn => {
                    const connNumber = conn.user.id.split(':')[0];
                    return clone.userNumber === connNumber;
                });
            });

            if (offlineClones.length > 0) {
                msg += `*⚪ STORED CLONES (Offline):*\n\n`;
                
                offlineClones.forEach((clone, i) => {
                    msg += `*${i + 1}.* ID: ${clone.authId}\n`;
                    msg += `   └ Number: ${clone.userNumber || 'N/A'}\n`;
                    msg += `   └ Status: ${clone.status || 'offline'}\n`;
                    if (clone.createdAt) {
                        const date = new Date(clone.createdAt);
                        msg += `   └ Created: ${date.toLocaleString()}\n`;
                    }
                    msg += `\n`;
                });
            }
        }

        msg += `*Total Online:* ${activeConns.length}\n`;
        if (HAS_DB) {
            msg += `*Total Stored:* ${storedClones.length}`;
        }

        const mentions = activeConns.map(c => c.user.id);

        await sock.sendMessage(chatId, { 
            text: msg,
            mentions: mentions
        }, { quoted: message });
    }
};

/*****************************************************************************
 * Developed by Mr Tohid
 * GitHub: https://github.com/Tohidkha6332
 * WhatsApp: https://whatsapp.com/channel/0029VaGyP933bbVC7G0x0i2T
 *
 * © 2026 Tohidkhan6332 — Part of the TOHID-AI Project.
 * Unauthorized copying or distribution is not allowed.
 *****************************************************************************/