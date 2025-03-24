// Import required packages
require("./config.js");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    jidDecode,
    Browsers,
    downloadContentFromMessage,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');
const path = require('path');
const { Boom } = require("@hapi/boom");
const fetch = require('node-fetch');
const FileType = require('file-type');
const NodeCache = require("node-cache");
const readline = require("readline");
const { smsg, imageToWebp, videoToWebp, writeExifImg, writeExifVid, toPTT, toAudio } = require("./lib/library.js");
const chalk = require("chalk");
const moment = require("moment");

// ========================= GLOBAL CONFIGURATION =========================
const isOwners = global.owner.map(number => number + '@s.whatsapp.net');

const config = {
    tmpDir: path.join(__dirname, './tmp'),
    botName: "ALFIKY ID",
    version: "1.0.0",
    developer: "Alfiky ID",
    showBanner: true,
    logLevel: "info", // Options: debug, info, warn, error
    autoReconnect: true,
    sessionFolder: "./session"
};

// ========================= LOGGER SYSTEM =========================
const logger = {
    debug: (message) => {
        if (config.logLevel === "debug") {
            console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] ${chalk.blue.bold('[DEBUG]')} ${message}`));
        }
    },
    info: (message) => {
        if (["debug", "info"].includes(config.logLevel)) {
            console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] ${chalk.green.bold('[INFO]')} ${message}`));
        }
    },
    warn: (message) => {
        if (["debug", "info", "warn"].includes(config.logLevel)) {
            console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] ${chalk.yellow.bold('[WARN]')} ${message}`));
        }
    },
    error: (message, error = null) => {
        console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] ${chalk.red.bold('[ERROR]')} ${message}`));
        if (error && config.logLevel === "debug") {
            console.error(error);
        }
    },
    success: (message) => {
        console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] ${chalk.greenBright.bold('[SUCCESS]')} ${message}`));
    },
    connection: (status, details = '') => {
        let statusColor;
        switch (status) {
            case 'connecting': statusColor = chalk.yellow.bold('[CONNECTING]'); break;
            case 'open': statusColor = chalk.green.bold('[CONNECTED]'); break;
            case 'close': statusColor = chalk.red.bold('[DISCONNECTED]'); break;
            default: statusColor = chalk.blue.bold(`[${status.toUpperCase()}]`);
        }
        console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] ${statusColor} ${details}`));
    }
};

// Display banner function
let bannerDisplayed = false;
function displayBanner() {
    if (bannerDisplayed || !config.showBanner) return;
    
    const banner = `
     █████╗ ██╗     ███████╗██╗██╗  ██╗██╗   ██╗    ██╗██████╗ 
    ██╔══██╗██║     ██╔════╝██║██║ ██╔╝╚██╗ ██╔╝    ██║██╔══██╗
    ███████║██║     █████╗  ██║█████╔╝  ╚████╔╝     ██║██║  ██║
    ██╔══██║██║     ██╔══╝  ██║██╔═██╗   ╚██╔╝      ██║██║  ██║
    ██║  ██║███████╗██║     ██║██║  ██╗   ██║       ██║██████╔╝
    ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝╚═════╝ 
    ══════════════════════ BASE ══════════════════════════════`;
    
    const botInfo = [
        `${chalk.yellow('┌───────────────────────────────────────────────┐')}`,
        `${chalk.yellow('│')} ${chalk.green('• Bot Name:')}      ${chalk.cyan(config.botName)}${' '.repeat(32 - config.botName.length)}${chalk.yellow('│')}`,
        `${chalk.yellow('│')} ${chalk.green('• Version:')}       ${chalk.cyan(config.version)}${' '.repeat(32 - config.version.length)}${chalk.yellow('│')}`,
        `${chalk.yellow('│')} ${chalk.green('• Developer:')}     ${chalk.cyan(config.developer)}${' '.repeat(32 - config.developer.length)}${chalk.yellow('│')}`,
        `${chalk.yellow('│')} ${chalk.green('• Date:')}          ${chalk.cyan(moment().format('DD-MM-YYYY'))}${' '.repeat(23)}${chalk.yellow('│')}`,
        `${chalk.yellow('│')} ${chalk.green('• Node Version:')}  ${chalk.cyan(process.version)}${' '.repeat(32 - process.version.length)}${chalk.yellow('│')}`,
        `${chalk.yellow('└───────────────────────────────────────────────┘')}`
    ];
    
    console.log(chalk.cyan(banner));
    console.log(botInfo.join('\n'));
    console.log('');
    
    bannerDisplayed = true;
}

// ========================= HELPER FUNCTIONS =========================

// CLI question helper
function question(text) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

// Create temp directory
function createTmpDir() {
    if (!fs.existsSync(config.tmpDir)) {
        fs.mkdirSync(config.tmpDir, { recursive: true });
        logger.success("Temp directory created");
    }
}

// Get buffer from URL
async function getBuffer(url) {
    try {
        logger.debug(`Downloading content from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        logger.error(`Error in getBuffer: ${e.message}`, e);
        return Buffer.alloc(0);
    }
}

// Clean old sessions
function cleanSessions(folder = config.sessionFolder) {
    logger.info("Cleaning old sessions...");
    let deletedCount = 0;
    
    try {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            return [];
        }
        
        const files = fs.readdirSync(folder);
        
        files.forEach(file => {
            const filePath = path.join(folder, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile() && 
                (Date.now() - stats.mtimeMs >= 1000 * 60 * 120) && 
                !file.includes('creds.json')) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });
        
        logger.info(`${deletedCount} old sessions cleaned`);
        return files;
    } catch (error) {
        logger.error(`Error cleaning sessions: ${error.message}`, error);
        return [];
    }
}

// Setup signal handlers
function setupSignalHandlers(database) {
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
        logger.warn("Received SIGINT signal, shutting down...");
        if (global.db) await database.write(global.db);
        process.exit(0);
    });
    
    // Handle uncaught errors
    process.on('unhandledRejection', (reason) => {
        logger.error(`Unhandled Rejection: ${reason}`);
    });
    
    process.on('uncaughtException', (err) => {
        logger.error(`Uncaught Exception: ${err.message}`, err);
    });
}

// ========================= MAIN BOT FUNCTION =========================
async function startBot() {
    try {
        // Initialize database
        const { DataBase } = require("./lib/database");
        const database = new DataBase();
        
        // Setup signal handlers
        setupSignalHandlers(database);
        
        // Load database
        const loadData = await database.read();
        if (loadData && Object.keys(loadData).length === 0) {
            global.db = {
                users: {},
                chats: {},
                database: {},
                groups: {},
                game: {},
                settings: {},
                others: {},
                sticker: {},
                ...(loadData || {}),
            };
            await database.write(global.db);
            logger.info("Database initialized with new structure");
        } else {
            global.db = loadData;
            logger.info("Existing database loaded");
        }
        
        // Save database periodically
        setInterval(async () => {
            if (global.db) await database.write(global.db);
        }, 3500);
        
        // Clean old sessions
        cleanSessions();
        
        // Create temp directory
        createTmpDir();
        
        // Display banner
        displayBanner();
        
        // Check Baileys version
        logger.info("Checking Baileys version...");
        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.success(`Using WA v${version.join('.')}, latest: ${isLatest ? 'Yes ✓' : 'No ✗'}`);
        
        // Initialize auth state
        logger.info("Loading auth state...");
        const { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder);
        
        // Group metadata cache
        const groupCache = new NodeCache({stdTTL: 5 * 60, useClones: false});
        
        // Create store
        const store = makeInMemoryStore({});
        store.readFromFile('./store.json');
        
        // Save store periodically
        setInterval(() => {
            store.writeToFile('./store.json');
        }, 10000);
        
        // Initialize WhatsApp connection
        logger.info("Creating WhatsApp connection...");
        const wa = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu("chrome"),
            version: [2, 3000, 1017531287],
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return undefined;
            }
        });
        
        // Request pairing code if needed
        if (!wa.authState.creds.registered) {
            try {
                logger.info("New session detected, starting pairing process...");
                console.log(chalk.cyan('╔═════════════════════════════════════════════╗'));
                console.log(chalk.cyan('║              PAIRING SESSION                ║'));
                console.log(chalk.cyan('╚═════════════════════════════════════════════╝'));
                
                console.log(chalk.white.bold("\n- Please enter your WhatsApp number, example: +628xxxx"));
                const phoneNumber = await question(chalk.green.bold(`– Your Number: `));

                logger.info(`Requesting pairing code for number ${phoneNumber}...`);
                const code = await wa.requestPairingCode(phoneNumber, 'ALFIKYID');

                setTimeout(() => {
                    console.log('\n' + chalk.white.bgGreen.bold(' YOUR PAIRING CODE '));
                    console.log(chalk.black.bgBlue.bold(` ${code.split('').join(' ')} `));
                    console.log(chalk.green.bold('\nEnter this code in your WhatsApp app'));
                    logger.info("Waiting for pairing confirmation from device...");
                }, 3000);
            } catch (error) {
                logger.error(`Error requesting pairing code: ${error.message}`, error);
                logger.warn("Please restart the bot to try again.");
            }
        } else {
            logger.success("Existing session detected, using it");
        }

        // Bind store to wa events
        store.bind(wa.ev);
        
        // Handle connection updates
        wa.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, isNewLogin } = update;

            if (isNewLogin) {
                wa.isInit = true;
                logger.success("New login detected!");
            }

            // Connection status
            if (connection) {
                logger.connection(connection, connection === 'close' ? 
                    `Reason: ${lastDisconnect?.error?.output?.payload?.message || 'Unknown'}` : 
                    '');
            }

            // Handle connection states
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                
                if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, 
                     DisconnectReason.timedOut, DisconnectReason.restartRequired].includes(reason)) {
                    if (config.autoReconnect) {
                        logger.info("Reconnecting...");
                        setTimeout(startBot, 5000);
                    }
                } else if (DisconnectReason.loggedOut === reason) {
                    logger.warn("Session logged out. Please scan again.");
                    wa.logout();
                } else {
                    logger.warn(`Connection closed with reason: ${reason}`);
                    if (config.autoReconnect) {
                        setTimeout(startBot, 10000);
                    }
                }
            } else if (connection === 'open') {
                logger.success(`Bot connected as: ${wa.user?.name} (${wa.user?.id.split(":")[0]})`);
            }
        });

        // Handle incoming messages
        wa.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = mek.message.ephemeralMessage ? mek.message.ephemeralMessage.message : mek.message;
                
                if (!wa.public && !isOwners.includes(mek.key.participant || mek.key.remoteJid) && !mek.key.fromMe && chatUpdate.type === "notify") return;
                
                const m = smsg(wa, mek, store);
                logger.debug(`Message received from: ${m.pushName || 'Unknown'} (${m.sender.split('@')[0]})`);
                
                require("./case.js")(wa, m, chatUpdate, store);
            } catch (err) {
                logger.error(`Error in messages.upsert event: ${err.message}`, err);
            }
        });

        // Handle credentials update
        wa.ev.on("creds.update", async () => {
            try {
                await saveCreds();
            } catch (error) {
                logger.error(`Error saving credentials: ${error.message}`, error);
            }
        });
        
        // Handle group updates
        wa.ev.on('groups.update', async (events) => {
            try {
                for (const event of events) {
                    logger.debug(`Group update for: ${event.id}`);
                    const metadata = await wa.groupMetadata(event.id);
                    groupCache.set(event.id, metadata);
                }
            } catch (error) {
                logger.error(`Error updating group metadata: ${error.message}`, error);
            }
        });

        // Handle group participants update
        wa.ev.on('group-participants.update', async (event) => {
            try {
                logger.debug(`Group participants changed in: ${event.id} (${event.action})`);
                const metadata = await wa.groupMetadata(event.id);
                groupCache.set(event.id, metadata);
            } catch (error) {
                logger.error(`Error updating group participants metadata: ${error.message}`, error);
            }
        });

        // ========================= UTILITY FUNCTIONS =========================
        
        // Decode JID
        wa.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
            }
            return jid;
        };
        
        // Set public mode
        wa.public = true;

        // Serialize message
        wa.serializeM = (m) => smsg(wa, m, store);

        // Download media message
        wa.downloadMediaMessage = async (message) => {
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(message, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        };

        // Send image as sticker
        wa.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
            let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
            let buffer;
            if (options && (options.packname || options.author)) {
                buffer = await writeExifImg(buff, options);
            } else {
                buffer = await imageToWebp(buff);
            }
            await wa.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
            return buffer;
        };

        // Send video as sticker
        wa.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
            let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
            let buffer;
            if (options && (options.packname || options.author)) {
                buffer = await writeExifVid(buff, options);
            } else {
                buffer = await videoToWebp(buff);
            }
            await wa.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
            return buffer;
        };

        // Get file
        wa.getFile = async (PATH, returnAsFilename) => {
            let res, filename;
            const data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
            if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
            const type = await FileType.fromBuffer(data) || {
                mime: 'application/octet-stream',
                ext: '.bin'
            };
            if (data && returnAsFilename && !filename) {
                filename = path.join(__dirname, './tmp/' + new Date * 1 + '.' + type.ext);
                await fs.promises.writeFile(filename, data);
            }
            return {
                res,
                filename,
                ...type,
                data,
                deleteFile() {
                    return filename && fs.promises.unlink(filename);
                }
            };
        };
        
        // Send file
        wa.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
            let type = await wa.getFile(path, true);
            let { res, data: file, filename: pathFile } = type;
            if (res && res.status !== 200 || file.length <= 65536) {
                try { throw { json: JSON.parse(file.toString()) }; }
                catch (e) { if (e.json) throw e.json; }
            }
            let opt = { filename };
            if (quoted) opt.quoted = quoted;
            if (!type) options.asDocument = true;
            let mtype = '', mimetype = type.mime, convert;
            if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
            else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
            else if (/video/.test(type.mime)) mtype = 'video';
            else if (/audio/.test(type.mime)) (
                convert = await (ptt ? toPTT : toAudio)(file, type.ext),
                file = convert.data,
                pathFile = convert.filename,
                mtype = 'audio',
                mimetype = 'audio/ogg; codecs=opus'
            );
            else mtype = 'document';
            if (options.asDocument) mtype = 'document';

            let message = {
                ...options,
                caption,
                ptt,
                [mtype]: { url: pathFile },
                mimetype
            };
            
            try {
                return await wa.sendMessage(jid, message, { ...opt, ...options });
            } catch (e) {
                logger.error(`Error sending file: ${e.message}`);
                return await wa.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
            }
        };
        
        // Send text
        wa.sendText = (jid, text, quoted = "", options) => {
            try {
                return wa.sendMessage(jid, { text, ...options }, { quoted });
            } catch (error) {
                logger.error(`Error in sendText: ${error.message}`);
                throw error;
            }
        };

        // Reply to message
        wa.reply = async (jid, text, quoted, options = {}) => {
            try {
                return await wa.sendMessage(jid, { 
                    text: text, 
                    ...options 
                }, { 
                    quoted,
                    ...options 
                });
            } catch (error) {
                logger.error(`Error in reply: ${error.message}`);
                if (error.message.includes('rate')) {
                    logger.warn("Rate limit detected, waiting before retrying...");
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return wa.sendMessage(jid, { text: text }, { quoted });
                }
                throw error;
            }
        };
        
        // Get name
        wa.getName = async (jid, withoutContact = false) => {
            try {
                const id = wa.decodeJid(jid);
                
                // If group JID
                if (id.endsWith("@g.us")) {
                    let cachedGroup = groupCache.get(id);
                    if (cachedGroup) {
                        return cachedGroup.name || cachedGroup.subject || jid;
                    }
                    
                    const metadata = await wa.groupMetadata(id);
                    return metadata.subject || jid;
                }
                
                // If WhatsApp or bot user
                if (id === "0@s.whatsapp.net") {
                    return "WhatsApp";
                } else if (id === wa.decodeJid(wa.user.id)) {
                    return wa.user.name;
                }
                
                // Get from store
                const v = store.contacts[id] || {};
                return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || jid;
            } catch (error) {
                logger.error(`Error in getName: ${error.message}`);
                return jid;
            }
        };

        logger.success("Bot ready to use!");
        return wa;
        
    } catch (err) {
        logger.error(`Error in start function: ${err.message}`, err);
        logger.warn("Restarting in 5 seconds...");
        setTimeout(startBot, 5000);
    }
}

// Start the bot
startBot().catch((err) => {
    console.error(chalk.red.bold('Failed to start:'), err);
    process.exit(1);
});

// Watch file for changes (development mode)
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.cyan.bold(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});