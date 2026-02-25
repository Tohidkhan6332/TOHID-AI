const fs = require('fs');
const path = require('path');
const store = require('./lightweight_store');

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

const dataPath = path.join(__dirname, '../data/userGroupData.json');

async function loadUserGroupData() {
    try {
        if (HAS_DB) {
            const data = await store.getSetting('global', 'userGroupData');
            return data || {
                users: [],
                groups: [],
                antilink: {},
                antibadword: {},
                antitag: {}, // Added antitag
                antistatus: {}, // Added antistatus
                warnings: {},
                sudo: [],
                welcome: {},
                goodbye: {},
                chatbot: {},
                autoReaction: false
            };
        } else {
            if (!fs.existsSync(dataPath)) {
                const defaultData = {
                    users: [],
                    groups: [],
                    antilink: {},
                    antibadword: {},
                    antitag: {}, // Added antitag
                    antistatus: {}, // Added antistatus
                    warnings: {},
                    sudo: [],
                    welcome: {},
                    goodbye: {},
                    chatbot: {},
                    autoReaction: false
                };
                fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
                return defaultData;
            }
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            
            // Ensure all required fields exist (for backward compatibility)
            if (!data.antitag) data.antitag = {};
            if (!data.antistatus) data.antistatus = {};
            if (!data.users) data.users = [];
            if (!data.groups) data.groups = [];
            if (!data.antilink) data.antilink = {};
            if (!data.antibadword) data.antibadword = {};
            if (!data.warnings) data.warnings = {};
            if (!data.sudo) data.sudo = [];
            if (!data.welcome) data.welcome = {};
            if (!data.goodbye) data.goodbye = {};
            if (!data.chatbot) data.chatbot = {};
            if (data.autoReaction === undefined) data.autoReaction = false;
            
            return data;
        }
    } catch (error) {
        console.error('Error loading user group data:', error);
        return {
            users: [],
            groups: [],
            antilink: {},
            antibadword: {},
            antitag: {},
            antistatus: {},
            warnings: {},
            sudo: [],
            welcome: {},
            goodbye: {},
            chatbot: {},
            autoReaction: false
        };
    }
}

async function saveUserGroupData(data) {
    try {
        if (HAS_DB) {
            await store.saveSetting('global', 'userGroupData', data);
        } else {
            const dir = path.dirname(dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        }
        return true;
    } catch (error) {
        console.error('Error saving user group data:', error);
        return false;
    }
}

// ==================== ANTILINK FUNCTIONS ====================

async function setAntilink(groupId, type, action) {
    try {
        const data = await loadUserGroupData();
        if (!data.antilink) data.antilink = {};
        
        data.antilink[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}

async function getAntilink(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (!data.antilink || !data.antilink[groupId]) return null;
        
        return type === 'on' ? data.antilink[groupId] : null;
    } catch (error) {
        console.error('Error getting antilink:', error);
        return null;
    }
}

async function removeAntilink(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (data.antilink && data.antilink[groupId]) {
            delete data.antilink[groupId];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing antilink:', error);
        return false;
    }
}

// ==================== ANTITAG FUNCTIONS ====================

async function setAntitag(groupId, type, action) {
    try {
        const data = await loadUserGroupData();
        if (!data.antitag) data.antitag = {};
        
        data.antitag[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting antitag:', error);
        return false;
    }
}

async function getAntitag(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (!data.antitag || !data.antitag[groupId]) return null;
        
        return type === 'on' ? data.antitag[groupId] : null;
    } catch (error) {
        console.error('Error getting antitag:', error);
        return null;
    }
}

async function removeAntitag(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (data.antitag && data.antitag[groupId]) {
            delete data.antitag[groupId];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing antitag:', error);
        return false;
    }
}

// ==================== ANTISTATUS FUNCTIONS ====================

async function setAntistatus(groupId, type, action) {
    try {
        const data = await loadUserGroupData();
        if (!data.antistatus) data.antistatus = {};
        
        data.antistatus[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting antistatus:', error);
        return false;
    }
}

async function getAntistatus(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (!data.antistatus || !data.antistatus[groupId]) return null;
        
        return type === 'on' ? data.antistatus[groupId] : null;
    } catch (error) {
        console.error('Error getting antistatus:', error);
        return null;
    }
}

async function removeAntistatus(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (data.antistatus && data.antistatus[groupId]) {
            delete data.antistatus[groupId];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing antistatus:', error);
        return false;
    }
}

async function isAntistatusEnabled(groupId) {
    try {
        const data = await loadUserGroupData();
        return data.antistatus && 
               data.antistatus[groupId] && 
               data.antistatus[groupId].enabled === true;
    } catch (error) {
        console.error('Error checking antistatus enabled:', error);
        return false;
    }
}

async function getAntistatusAction(groupId) {
    try {
        const data = await loadUserGroupData();
        if (data.antistatus && data.antistatus[groupId]) {
            return data.antistatus[groupId].action || 'delete';
        }
        return 'delete';
    } catch (error) {
        console.error('Error getting antistatus action:', error);
        return 'delete';
    }
}

// ==================== ANTIBADWORD FUNCTIONS ====================

async function setAntiBadword(groupId, type, action) {
    try {
        const data = await loadUserGroupData();
        if (!data.antibadword) data.antibadword = {};
        
        data.antibadword[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting antibadword:', error);
        return false;
    }
}

async function getAntiBadword(groupId, type) {
    try {
        const data = await loadUserGroupData();
        
        if (!data.antibadword || !data.antibadword[groupId]) {
            return null;
        }
        
        const config = data.antibadword[groupId];
        
        return type === 'on' ? config : null;
    } catch (error) {
        console.error('Error getting antibadword:', error);
        return null;
    }
}

async function removeAntiBadword(groupId, type) {
    try {
        const data = await loadUserGroupData();
        if (data.antibadword && data.antibadword[groupId]) {
            delete data.antibadword[groupId];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing antibadword:', error);
        return false;
    }
}

// ==================== WARNINGS FUNCTIONS ====================

async function incrementWarningCount(groupId, userId) {
    try {
        const data = await loadUserGroupData();
        if (!data.warnings) data.warnings = {};
        if (!data.warnings[groupId]) data.warnings[groupId] = {};
        if (!data.warnings[groupId][userId]) data.warnings[groupId][userId] = 0;
        
        data.warnings[groupId][userId]++;
        await saveUserGroupData(data);
        return data.warnings[groupId][userId];
    } catch (error) {
        console.error('Error incrementing warning count:', error);
        return 0;
    }
}

async function resetWarningCount(groupId, userId) {
    try {
        const data = await loadUserGroupData();
        if (data.warnings && data.warnings[groupId] && data.warnings[groupId][userId]) {
            delete data.warnings[groupId][userId]; // Remove instead of set to 0
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error resetting warning count:', error);
        return false;
    }
}

async function getWarningCount(groupId, userId) {
    try {
        const data = await loadUserGroupData();
        return data.warnings?.[groupId]?.[userId] || 0;
    } catch (error) {
        console.error('Error getting warning count:', error);
        return 0;
    }
}

// ==================== SUDO FUNCTIONS ====================

async function isSudo(userId) {
    try {
        const data = await loadUserGroupData();
        return data.sudo && data.sudo.includes(userId);
    } catch (error) {
        console.error('Error checking sudo:', error);
        return false;
    }
}

async function addSudo(userJid) {
    try {
        const data = await loadUserGroupData();
        if (!data.sudo) data.sudo = [];
        if (!data.sudo.includes(userJid)) {
            data.sudo.push(userJid);
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error adding sudo:', error);
        return false;
    }
}

async function removeSudo(userJid) {
    try {
        const data = await loadUserGroupData();
        if (!data.sudo) data.sudo = [];
        const idx = data.sudo.indexOf(userJid);
        if (idx !== -1) {
            data.sudo.splice(idx, 1);
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing sudo:', error);
        return false;
    }
}

async function getSudoList() {
    try {
        const data = await loadUserGroupData();
        return Array.isArray(data.sudo) ? data.sudo : [];
    } catch (error) {
        console.error('Error getting sudo list:', error);
        return [];
    }
}

// ==================== WELCOME FUNCTIONS ====================

async function addWelcome(jid, enabled, message) {
    try {
        const data = await loadUserGroupData();
        if (!data.welcome) data.welcome = {};
        
        data.welcome[jid] = {
            enabled: enabled,
            message: message || '╔═⚔️ TOHID-AI WELCOME ⚔️═╗\n║ 🛡️ User: {user}\n║ 🏰 Kingdom: {group}\n╠═══════════════╣\n║ 📜 Message:\n║ {description}\n╚═══════════════╝',
            channelId: '120363207624903731@newsletter'
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error in addWelcome:', error);
        return false;
    }
}

async function delWelcome(jid) {
    try {
        const data = await loadUserGroupData();
        if (data.welcome && data.welcome[jid]) {
            delete data.welcome[jid];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error in delWelcome:', error);
        return false;
    }
}

async function isWelcomeOn(jid) {
    try {
        const data = await loadUserGroupData();
        return data.welcome && data.welcome[jid] && data.welcome[jid].enabled;
    } catch (error) {
        console.error('Error in isWelcomeOn:', error);
        return false;
    }
}

async function getWelcome(jid) {
    try {
        const data = await loadUserGroupData();
        return data.welcome && data.welcome[jid] ? data.welcome[jid].message : null;
    } catch (error) {
        console.error('Error in getWelcome:', error);
        return null;
    }
}

// ==================== GOODBYE FUNCTIONS ====================

async function addGoodbye(jid, enabled, message) {
    try {
        const data = await loadUserGroupData();
        if (!data.goodbye) data.goodbye = {};
        
        data.goodbye[jid] = {
            enabled: enabled,
            message: message || '╔═⚔️ TOHID-AI GOODBYE ⚔️═╗\n║ 🛡️ User: {user}\n║ 🏰 Kingdom: {group}\n╠═══════════════╣\n║ ⚰️ We will never miss you!\n╚═══════════════╝',
            channelId: '120363207624903731@newsletter'
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error in addGoodbye:', error);
        return false;
    }
}

async function delGoodBye(jid) {
    try {
        const data = await loadUserGroupData();
        if (data.goodbye && data.goodbye[jid]) {
            delete data.goodbye[jid];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error in delGoodBye:', error);
        return false;
    }
}

async function isGoodByeOn(jid) {
    try {
        const data = await loadUserGroupData();
        return data.goodbye && data.goodbye[jid] && data.goodbye[jid].enabled;
    } catch (error) {
        console.error('Error in isGoodByeOn:', error);
        return false;
    }
}

async function getGoodbye(jid) {
    try {
        const data = await loadUserGroupData();
        return data.goodbye && data.goodbye[jid] ? data.goodbye[jid].message : null;
    } catch (error) {
        console.error('Error in getGoodbye:', error);
        return null;
    }
}

// ==================== CHATBOT FUNCTIONS ====================

async function setChatbot(groupId, enabled) {
    try {
        const data = await loadUserGroupData();
        if (!data.chatbot) data.chatbot = {};
        
        data.chatbot[groupId] = {
            enabled: enabled
        };
        
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting chatbot:', error);
        return false;
    }
}

async function getChatbot(groupId) {
    try {
        const data = await loadUserGroupData();
        return data.chatbot?.[groupId] || null;
    } catch (error) {
        console.error('Error getting chatbot:', error);
        return null;
    }
}

async function removeChatbot(groupId) {
    try {
        const data = await loadUserGroupData();
        if (data.chatbot && data.chatbot[groupId]) {
            delete data.chatbot[groupId];
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing chatbot:', error);
        return false;
    }
}

// ==================== AUTO REACTION FUNCTIONS ====================

async function setAutoReaction(enabled) {
    try {
        const data = await loadUserGroupData();
        data.autoReaction = enabled;
        await saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting auto reaction:', error);
        return false;
    }
}

async function getAutoReaction() {
    try {
        const data = await loadUserGroupData();
        return data.autoReaction || false;
    } catch (error) {
        console.error('Error getting auto reaction:', error);
        return false;
    }
}

// ==================== USER & GROUP FUNCTIONS ====================

async function addUser(userJid) {
    try {
        const data = await loadUserGroupData();
        if (!data.users) data.users = [];
        if (!data.users.includes(userJid)) {
            data.users.push(userJid);
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error adding user:', error);
        return false;
    }
}

async function removeUser(userJid) {
    try {
        const data = await loadUserGroupData();
        if (!data.users) data.users = [];
        const idx = data.users.indexOf(userJid);
        if (idx !== -1) {
            data.users.splice(idx, 1);
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing user:', error);
        return false;
    }
}

async function addGroup(groupJid) {
    try {
        const data = await loadUserGroupData();
        if (!data.groups) data.groups = [];
        if (!data.groups.includes(groupJid)) {
            data.groups.push(groupJid);
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error adding group:', error);
        return false;
    }
}

async function removeGroup(groupJid) {
    try {
        const data = await loadUserGroupData();
        if (!data.groups) data.groups = [];
        const idx = data.groups.indexOf(groupJid);
        if (idx !== -1) {
            data.groups.splice(idx, 1);
            
            // Also remove all group-specific settings
            if (data.antilink && data.antilink[groupJid]) delete data.antilink[groupJid];
            if (data.antibadword && data.antibadword[groupJid]) delete data.antibadword[groupJid];
            if (data.antitag && data.antitag[groupJid]) delete data.antitag[groupJid];
            if (data.antistatus && data.antistatus[groupJid]) delete data.antistatus[groupJid];
            if (data.warnings && data.warnings[groupJid]) delete data.warnings[groupJid];
            if (data.welcome && data.welcome[groupJid]) delete data.welcome[groupJid];
            if (data.goodbye && data.goodbye[groupJid]) delete data.goodbye[groupJid];
            if (data.chatbot && data.chatbot[groupJid]) delete data.chatbot[groupJid];
            
            await saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing group:', error);
        return false;
    }
}

async function getAllGroups() {
    try {
        const data = await loadUserGroupData();
        return Array.isArray(data.groups) ? data.groups : [];
    } catch (error) {
        console.error('Error getting all groups:', error);
        return [];
    }
}

async function getAllUsers() {
    try {
        const data = await loadUserGroupData();
        return Array.isArray(data.users) ? data.users : [];
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

// ==================== MODULE EXPORTS ====================

module.exports = {
    // Data management
    loadUserGroupData,
    saveUserGroupData,
    
    // Users & Groups
    addUser,
    removeUser,
    getAllUsers,
    addGroup,
    removeGroup,
    getAllGroups,
    
    // Antilink
    setAntilink,
    getAntilink,
    removeAntilink,
    
    // Antitag
    setAntitag,
    getAntitag,
    removeAntitag,
    
    // Antistatus
    setAntistatus,
    getAntistatus,
    removeAntistatus,
    isAntistatusEnabled,
    getAntistatusAction,
    
    // AntiBadword
    setAntiBadword,
    getAntiBadword,
    removeAntiBadword,
    
    // Warnings
    incrementWarningCount,
    resetWarningCount,
    getWarningCount,
    
    // Sudo
    isSudo,
    addSudo,
    removeSudo,
    getSudoList,
    
    // Welcome
    addWelcome,
    delWelcome,
    isWelcomeOn,
    getWelcome,
    
    // Goodbye
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    getGoodbye,
    
    // Chatbot
    setChatbot,
    getChatbot,
    removeChatbot,
    
    // Auto Reaction
    setAutoReaction,
    getAutoReaction
};