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
const { readdirSync, statSync, unlinkSync } = require('fs');
const { join } = require('path');
const fs = require('fs');
const path = require('path');
const { Boom } = require("@hapi/boom");
const fetch = require('node-fetch');
const FileType = require('file-type');
const NodeCache = require("node-cache");
const readline = require("readline");
const { smsg, imageToWebp, videoToWebp, writeExifImg, writeExifVid, toPTT, toAudio } = require("./lib/library.js");
const _ = require('lodash');
const chalk = require("chalk");

const displayBanner = () => {
    const banner = `
     █████╗ ██╗     ███████╗██╗██╗  ██╗██╗   ██╗    ██╗██████╗ 
    ██╔══██╗██║     ██╔════╝██║██║ ██╔╝╚██╗ ██╔╝    ██║██╔══██╗
    ███████║██║     █████╗  ██║█████╔╝  ╚████╔╝     ██║██║  ██║
    ██╔══██║██║     ██╔══╝  ██║██╔═██╗   ╚██╔╝      ██║██║  ██║
    ██║  ██║███████╗██║     ██║██║  ██╗   ██║       ██║██████╔╝
    ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝╚═════╝ 
    ══════════════════════ BASE ══════════════════════════════`;
    console.log(chalk.cyan(banner));
    console.log(chalk.yellow('WhatsApp Bot Status: Initializing'));
    console.log(chalk.yellow('Version: 1.0.0'));
    console.log(chalk.yellow('Developer: Alfiky ID'));
};

const showProgressBar = (progress, total) => {
    const width = 50;
    const completed = Math.floor(width * (progress / total));
    const remaining = width - completed;
    const bar = '█'.repeat(completed) + '░'.repeat(remaining);
    const percentage = Math.floor((progress / total) * 100);
    process.stdout.write(`\r${chalk.cyan.bold('[LOADING]')} ${bar} ${chalk.green.bold(`${percentage}%`)}`);
    if (progress === total) {
        process.stdout.write('\n\n');
    }
};

const groupCache = new NodeCache({stdTTL: 5 * 60, useClones: false})

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, resolve));
};

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const globalConfig = {
   
    tmpDir: path.join(__dirname, './tmp')
};
const { DataBase, LoadDataBase } = require("./lib/database");
const database = new DataBase();
(async () => {
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
  } else {
    global.db = loadData;
  }

  setInterval(async () => {
    if (global.db) await database.write(global.db);
  }, 3500);
})();

const createTmpDir = () => {
    if (!fs.existsSync(globalConfig.tmpDir)) {
        fs.mkdirSync(globalConfig.tmpDir, { recursive: true });
        console.log(chalk.green.bold('✅ Created tmp directory for temporary files'));
    }
};

const getBuffer = async (url) => {
    try {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        console.error('Error in getBuffer:', e);
        return Buffer.alloc(0);
    }
};

/*const attemptFixSession = async () => {
    try {
        console.log(chalk.cyan.bold('🔧 Attempting to repair session...'));
        if (fs.existsSync('./session')) {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const backupDir = `./session_backup_${timestamp}`;
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            const files = fs.readdirSync('./session');
            for (const file of files) {
                fs.copyFileSync(path.join('./session', file), path.join(backupDir, file));
            }
            console.log(chalk.cyan.bold(`📁 Session backup created at ${backupDir}`));
        }
        const { state, saveCreds } = await useMultiFileAuthState("session");
        await saveCreds();
        console.log(chalk.green.bold('✅ Session repair attempt completed'));
        return true;
    } catch (err) {
        console.error('Error attempting to fix session:', err);
        return false;
    }
};*/


function clearSessions(folder = './session') {
    let filename = [];
    readdirSync(folder).forEach(file => filename.push(join(folder, file)));
    return filename.map(file => {
        let stats = statSync(file);
        if (
            stats.isFile() &&
            (Date.now() - stats.mtimeMs >= 1000 * 60 * 120) &&
            !file.includes('creds.json')
        ) {
            console.log('🗑️ Deleted old session:', file);
            return unlinkSync(file);
        }
        return false;
    });
}


const startBot = async () => {
    try {
        clearSessions(); 
        displayBanner();
        for (let i = 1; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            showProgressBar(i, 5);
        }
        console.log(chalk.blue.bold('✨ Starting WhatsApp Bot Service ✨'));
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(chalk.blue.bold(`📱 Using WA v${version.join('.')}, isLatest: ${isLatest ? chalk.green('✓') : chalk.red('✗')}`));
        const { state, saveCreds } = await useMultiFileAuthState("./session");

        const logger = pino({ 
            level: "warn",
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'hostname,pid'
                }
            }
        });


// Tambahkan konfigurasi yang lebih lengkap untuk fell:
const fell = makeWASocket({  
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 30000,
    emitOwnEvents: false,
    fireInitQueries: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    useStore: true,
    markOnlineOnConnect: true,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu("chrome"),
    version: [2, 3000, 1017531287],
    getMessage: async (key) => {
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id);
            return msg?.message || undefined;
        }
        return { conversation: '[Error] Message not found in store' };
    },
    patchMessageBeforeSending: (message) => {
        if (message.buttonText) {
            message.buttonText = message.buttonText || '';
        }
        return message;
    }
    
});
// Request pairing code setelah setup koneksi
if (!fell.authState.creds.registered) {
    try {
        console.log(chalk.cyan('╔═════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║              PAIRING SESSION                ║'));
        console.log(chalk.cyan('╚═════════════════════════════════════════════╝'));
        
        console.log(chalk.white.bold("\n- Please enter your WhatsApp number, e.g. +628xxxx"));
        const phoneNumber = await question(chalk.green.bold(`– Your number: `));

        const code = await fell.requestPairingCode(phoneNumber, 'ALFIKYID');

        setTimeout(() => {
            console.log('\n' + chalk.white.bgGreen.bold(' YOUR PAIRING CODE '));
            console.log(chalk.black.bgBlue.bold(` ${code.split('').join(' ')} `));
            console.log(chalk.green.bold('\nEnter this code in your WhatsApp app'));
        }, 3000);
    } catch (error) {
        console.error(chalk.red.bold('❌ Error requesting pairing code:'), error);
        console.log(chalk.yellow.bold('🔄 Please restart the bot to try again.'));
    }
}

        store.bind(fell.ev);

       
    // **Menangani koneksi WhatsApp di dalam event update**
    fell.ev.on('connection.update', async (update) => {
        const { receivedPendingNotifications, connection, lastDisconnect, isOnline, isNewLogin } = update;

        if (isNewLogin) {
            fell.isInit = true;
            console.log(chalk.green('✅ Login Baru Terdeteksi'));
        }

        switch (connection) {
            case 'connecting':
                console.log(chalk.yellow('🔄 Menghubungkan ke WhatsApp...'));
                break;
            case 'open':
                console.log(chalk.green('\n✅ Bot berhasil terhubung ke WhatsApp!'));
                break;
            case 'close':
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                switch (reason) {
                    case DisconnectReason.connectionClosed:
                    case DisconnectReason.connectionLost:
                    case DisconnectReason.timedOut:
                        console.log(chalk.yellow.bold("🔄 Reconnecting..."));
                        startBot();
                        break;
                    case DisconnectReason.connectionReplaced:
                    case DisconnectReason.loggedOut:
                        console.log(chalk.green.bold("🚪 Please scan again."));
                        fell.logout();
                        break;
                    case DisconnectReason.restartRequired:
                        console.log(chalk.green.bold("🔄 Restarting..."));
                        startBot();
                        break;
                    default:
                        console.log(chalk.yellow.bold("⚠️ Connection error, attempting to reconnect..."));
                        startBot();
                        break;
                }
                break;
        }

        if (isOnline === true) console.log(chalk.green('📶 Status: Online'));
        if (isOnline === false) console.log(chalk.red('📴 Status: Offline'));
        if (receivedPendingNotifications) {
            console.log(chalk.blue('📩 Menunggu pesan baru...'));
        }
    });

        fell.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = mek.message.ephemeralMessage ? mek.message.ephemeralMessage.message : mek.message;
                if (!fell.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
                const m = smsg(fell, mek, store);
                require("./case.js")(fell, m, chatUpdate, store);
            } catch (err) {
                console.log('Error in messages.upsert event:', err);
            }
        });

        fell.ev.on("creds.update", saveCreds);
        
        fell.ev.on('groups.update', async ([event]) => {
    		const metadata = await fell.groupMetadata(event.id)
   					 groupCache.set(event.id, metadata)
			})

     	fell.ev.on('group-participants.update', async (event) => {
    		const metadata = await fell.groupMetadata(event.id)
   					 groupCache.set(event.id, metadata)
			})

        fell.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
            }
            return jid;
        };
        
         fell.public = true

        fell.serializeM = (m) => smsg(fell, m, store);

// Fungsi mengirim teks dengan tombol
fell.sendButtonText = async (jid, buttons = [], text, footer, quoted = '', options = {}) => {
    let buttonMessage = {
        text,
        footer,
        buttons,
        headerType: 2,
        ...options
    }
    return fell.sendMessage(jid, buttonMessage, { quoted, ...options })
};

// Fungsi mengirim gambar
fell.sendImage = async (jid, path, caption = '', quoted = '', options = {}) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await fell.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
};

// Fungsi mengirim video
fell.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options = {}) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await fell.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted });
};

// Fungsi mengirim audio
fell.sendAudio = async (jid, path, quoted = '', ptt = false, options = {}) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await fell.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted });
};

// Fungsi mengirim dokumen
fell.sendDoc = async (jid, path, filename = '', caption = '', quoted = '', options = {}) => {
    let buffer;
    if (Buffer.isBuffer(path)) {
        buffer = path;
    } else if (path.startsWith('http')) {
        buffer = await getBuffer(path);
    } else if (fs.existsSync(path)) {
        buffer = fs.readFileSync(path);
    } else {
        buffer = Buffer.alloc(0);
    }
    
    let mimetype = await FileType.fromBuffer(buffer) || {mime: 'application/octet-stream'};
    
    return await fell.sendMessage(jid, { 
        document: buffer, 
        mimetype: mimetype.mime,
        fileName: filename,
        caption: caption,
        ...options 
    }, { quoted });
};

// Fungsi mengirim kontak
fell.sendContact = async (jid, number, name, quoted = '', options = {}) => {
    let vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                'FN:' + name + '\n' +
                'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n' +
                'END:VCARD';
    return fell.sendMessage(jid, { 
        contacts: { 
            displayName: name, 
            contacts: [{ vcard }] 
        },
        ...options
    }, { quoted });
};

// Fungsi mengirim reaction
fell.sendReaction = async (jid, key, text) => {
    return await fell.sendMessage(jid, {
        react: {
            text: text,
            key: key
        }
    });
};

// Fungsi mengirim template
fell.sendTemplate = async (jid, templateButtons, text, footer, quoted = '', options = {}) => {
    let templateMessage = {
        text: text,
        footer: footer,
        templateButtons: templateButtons,
        ...options
    };
    return fell.sendMessage(jid, templateMessage, { quoted, ...options });
};

// Fungsi copy message
fell.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
        message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
        vtype = Object.keys(message.message.viewOnceMessage.message)[0];
        delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
        delete message.message.viewOnceMessage.message[vtype].viewOnce;
        message.message = {
            ...message.message.viewOnceMessage.message
        };
    }
    return await fell.copyNForward(jid, message, forceForward, options);
};

// Fungsi quote message
fell.quoted = async (message) => {
    if (!message.isQuoted) return false;
    let type = Object.keys(message.quoted)[0];
    let q = await store.loadMessage(message.quoted.remoteJid, message.quoted.id);
    return q || false;
};

// Fungsi download media
fell.downloadM = async (message, type, filename = '') => {
    if (!message) return Buffer.alloc(0);
    let stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    if (filename) fs.writeFileSync(filename, buffer);
    return buffer;
};

// Fungsi get group members
fell.groupMembers = async (jid) => {
    let groupMetadata = await fell.groupMetadata(jid);
    return groupMetadata.participants;
};

// Fungsi get group admins
fell.groupAdmins = async (jid) => {
    let participants = await fell.groupMembers(jid);
    return participants.filter(p => p.admin).map(p => p.id);
};

        fell.getName = async (jid, withoutContact = false) => {
            const id = fell.decodeJid(jid);
            withoutContact = fell.withoutContact || withoutContact;
            if (id.endsWith("@g.us")) {
                const v = store.contacts[id] || (await fell.groupMetadata(id)) || {};
                return v.name || v.subject || jid;
            }
            const v = id === "0@s.whatsapp.net" ? { id, name: "WhatsApp" } : id === fell.decodeJid(fell.user.id) ? fell.user : store.contacts[id] || {};
            return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || jid;
        };

        fell.sendText = (jid, text, quoted = "", options) => fell.sendMessage(jid, { text, ...options }, { quoted });
 // Fungsi-fungsi untuk pesan
fell.reply = async (jid, text, quoted, options = {}) => {
    return fell.sendMessage(jid, { 
        text: text, 
        ...options 
    }, { 
        quoted,
        ...options 
    });
};

          // Media handling functions
        fell.downloadMediaMessage = async (message) => {
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(message, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        };

        fell.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
            let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
            let buffer;
            if (options && (options.packname || options.author)) {
                buffer = await writeExifImg(buff, options);
            } else {
                buffer = await imageToWebp(buff);
            }
            await fell.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
            return buffer;
        };

        fell.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
            let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
            let buffer;
            if (options && (options.packname || options.author)) {
                buffer = await writeExifVid(buff, options);
            } else {
                buffer = await videoToWebp(buff);
            }
            await fell.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
            return buffer;
        };

        fell.getFile = async (PATH, returnAsFilename) => {
            let res, filename;
            const data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
            if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
            const type = await FileType.fromBuffer(data) || {
                mime: 'application/octet-stream',
                ext: '.bin'
            };
            if (data && returnAsFilename && !filename) (filename = path.join(__dirname, './tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data));
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
        
        fell.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
            let type = await fell.getFile(path, true);
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
            let m;
            try {
                m = await fell.sendMessage(jid, message, { ...opt, ...options });
            } catch (e) {
                console.error(e);
                m = null;
            } finally {
                if (!m) m = await fell.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
                return m;
            }
        };
        
        // Send list message
        fell.sendListMsg = async (jid, text = '', footer = '', title = '', buttonText = '', sections = [], quoted) => {
            try {
                let message = {
                    text,
                    footer,
                    title,
                    buttonText,
                    sections
                };
                return await fell.sendMessage(jid, message, { quoted });
            } catch (error) {
                console.error('Error sending list message:', error);
                if (error.output?.statusCode === 429) {
                    console.log('Rate limit hit, waiting before retry...');
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    return await fell.sendListMsg(jid, text, footer, title, buttonText, sections, quoted);
                }
                throw error;
            }
        };
        
        fell.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
            let quoted = message.m ? message.m : message;
            let mime = (message.m || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
            // save to file
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };

        // Rate limit check utility
        fell.isRateLimitError = (error) => {
            return error?.output?.statusCode === 429;
        };

    } catch (err) {
        console.error(chalk.red.bold('Error in start function:'), err);
        console.log(chalk.yellow.bold('Restarting in 5 seconds...'));
        setTimeout(startBot, 5000);
    }
};


startBot().catch((err) => {
    console.error(chalk.red.bold('Failed to start:'), err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ Unhandled Error:', err);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.cyan.bold(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});