require("./config.js")
const fs = require("fs")
const moment = require("moment-timezone")
const chalk = require('chalk')
const { exec } = require("child_process")
const Handler = require('./handler.js')
const { LoadDataBase } = require('./lib/database')


const {
    makeWASocket,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReRaolLatestXectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisRaolLatestXectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    templateMessage
} = require('@whiskeysockets/baileys');

const {
    getGroupAdmins,
} = require("./lib/library.js")

const Func = require('./lib/functions.js')


// Time-related constants
const hariini = moment.tz('Asia/Jakarta').format('DD MMMM YYYY')
const wib = moment.tz('Asia/Jakarta').format('HH : mm : ss')
const wit = moment.tz('Asia/Jayapura').format('HH : mm : ss')
const wita = moment.tz('Asia/Makassar').format('HH : mm : ss')
let dt = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('a')
const salam = 'Selamat '+dt.charAt(0).toUpperCase() + dt.slice(1)    
let dot = new Date(new Date + 3600000)
const dateIslamic = Intl.DateTimeFormat("id" + '-TN-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
}).format(dot)
const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY')
const time2 = moment().tz('Asia/Jakarta').format('HH:mm:ss')

let ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ᴛᴇɴɢᴀʜ ᴍᴀʟᴀᴍ'
if (time2 < "05:00:00") ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ꜱᴜʙᴜʜ'
if (time2 < "10:00:00") ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ᴘᴀɢɪ'
if (time2 < "15:00:00") ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ꜱɪᴀɴɢ️'
if (time2 < "18:00:00") ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ꜱᴏʀᴇ'
if (time2 < "19:00:00") ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ᴘᴇᴛᴀɴɢ'
if (time2 < "23:59:00") ucapanWaktu = 'ꜱᴇʟᴀᴍᴀᴛ ᴍᴀʟᴀᴍ️'

let emojiwaktu = '🌙'
if (time2 < "05:00:00") emojiwaktu = '🌙'
if (time2 < "11:00:00") emojiwaktu = '🌄'
if (time2 < "15:00:00") emojiwaktu = '☀️'
if (time2 < "17:00:00") emojiwaktu = '🌅'
if (time2 < "18:00:00") emojiwaktu = '🌅'
if (time2 < "19:00:00") emojiwaktu = '🌙'
if (time2 < "23:59:00") emojiwaktu = '🌌'

module.exports = async (fell, m) => {
    try {
        
        await LoadDataBase(fell, m)
        const body = (
    (m.mtype === 'conversation' && m.message.conversation) ||
    (m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
    (m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
    (m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
    (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
    (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
    (m.mtype === 'listResponseMessage' && m.message.listResponseMessage.singleSelectReply.selectedRowId) ||
    (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId) ||
    (m.mtype === 'interactiveResponseMessage' && JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id) ||
    (m.mtype === 'messageContextInfo' && (
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
        m.text
    ))
) ? (
    (m.mtype === 'conversation' && m.message.conversation) ||
    (m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
    (m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
    (m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
    (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
    (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
    (m.mtype === 'listResponseMessage' && m.message.listResponseMessage.singleSelectReply.selectedRowId) ||
    (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId) ||
    (m.mtype === 'interactiveResponseMessage' && JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id) ||
    (m.mtype === 'messageContextInfo' && (
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
        m.text
    ))
) : '';


        const budy = (typeof m.text === 'string') ? m.text : '';
        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/\s+/).slice(1)
        const text = q = body.slice(prefix.length).trim().slice(command.length).trim();
        const sender = m.key.fromMe ? (fell.user.id.split(':')[0] + '@s.whatsapp.net' || fell.user.id) : (m.key.participant || m.key.remoteJid)
        const botNumber = await fell.decodeJid(fell.user.id)
        const senderNumber = sender.split('@')[0]
        const pushname = m.pushName || `${senderNumber}`
        const isBot = botNumber.includes(senderNumber)
        const fatkuns = (m.quoted || m)
        const quoted = (fatkuns.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]] : (fatkuns.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]] : (fatkuns.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]] : m.quoted ? m.quoted : m
        const mime = (quoted.m || quoted).mimetype || ''
        const qmsg = (quoted.m || quoted)
        const isCreator = (m && m.sender && [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;

        const groupMetadata = m.isGroup ? await fell.groupMetadata(m.chat).catch(e => { }) : ''
        const groupName = m.isGroup ? groupMetadata?.subject : ''
        const participants = m.isGroup ? await groupMetadata.participants : ''
        const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
        const groupOwner = m.isGroup ? groupMetadata.owner : ''
        const isGroupOwner = m.isGroup ? (groupOwner ? groupOwner : groupAdmins).includes(m.sender) : false
        
        //temporary
    

        
        // customize quoted
        const qtoko = {key: {fromMe: false, participant: `0@s.whatsapp.net`, ...(m.chat ? {remoteJid: "status@broadcast"} : {})}, message: {"productMessage": {"product": {"productImage": {"mimetype": "image/jpeg", "jpegThumbnail": ""}, "title": `Alfikyy - ID`, "description": null, "currencyCode": "IDR", "priceAmount1000": "1717171717", "retailerId": `Alfikyy`, "productImageCount": 1}, "businessOwnerJid": `0@s.whatsapp.net`}}}

      
        if (isCmd) {
    // Get current time with milliseconds
    const now = new Date();
    const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
    
    // Get chat details with emoji indicators
    const chatType = m.isGroup ? "👥 Group" : "👤 Private";
    const chatName = m.isGroup ? (m.groupName || m.chat.split('@')[0]) : pushname;
    const chatId = m.chat.split('@')[0].slice(0, 6) + '...';
    
    // Format command nicely
    const cmdSymbol = command.startsWith('!') ? command : `!${command}`;
    
    // Get device type if available
    const device = m?.key?.id?.startsWith('BAE5') ? '📱 Mobile' : 
                   m?.key?.id?.startsWith('3EB0') ? '💻 Web' : '📟 Unknown';
    
    // Calculate execution time if possible
    const execTime = m.messageTimestamp ? `${(now.getTime()/1000 - m.messageTimestamp) * 1000}ms` : '';
    
    // Pretty argument formatting
    const argDisplay = args.length > 0 
        ? args.map(arg => chalk.cyan(`"${arg}"`)).join(', ')
        : chalk.gray('none');
    
    // Create a border box
    console.log(chalk.blue('╭────────────────────────────────────────────────────────────────────────╮'));
    console.log(chalk.blue('│') + chalk.bold.yellow(' ALFIKY COMMAND EXECUTION ') + ' '.repeat(43) + chalk.blue('│'));
    console.log(chalk.blue('├────────────────────────────────────────────────────────────────────────┤'));
    console.log(chalk.blue('│') + chalk.magenta(' ⏱️  Time    : ') + chalk.white(timestamp) + ' '.repeat(50 - timestamp.length) + chalk.blue('│'));
    console.log(chalk.blue('│') + chalk.magenta(' 🔧 Command : ') + chalk.greenBright(cmdSymbol) + ' '.repeat(50 - cmdSymbol.length) + chalk.blue('│'));
    console.log(chalk.blue('│') + chalk.magenta(' 👤 User    : ') + chalk.white(pushname) + ' '.repeat(50 - pushname.length) + chalk.blue('│'));
    console.log(chalk.blue('│') + chalk.magenta(' 💬 Chat    : ') + chalk.white(`${chatType} (${chatName}) [${chatId}]`) + ' '.repeat(Math.max(0, 50 - (`${chatType} (${chatName}) [${chatId}]`).length)) + chalk.blue('│'));
    console.log(chalk.blue('│') + chalk.magenta(' 📦 Args    : ') + (args.length > 0 ? chalk.white(`[${args.length}] `) : chalk.gray('none')) + ' '.repeat(Math.max(0, 49 - (args.length > 0 ? 4 + args.length.toString().length : 4))) + chalk.blue('│'));
    
    if (args.length > 0) {
        console.log(chalk.blue('│') + ' '.repeat(12) + argDisplay + ' '.repeat(Math.max(0, 50 - argDisplay.length - 12)) + chalk.blue('│'));
    }
    
    if (device || execTime) {
        console.log(chalk.blue('│') + chalk.magenta(' 🔍 Details : ') + chalk.gray(`${device}${execTime ? ', Latency: ' + execTime : ''}`) + ' '.repeat(Math.max(0, 50 - (`${device}${execTime ? ', Latency: ' + execTime : ''}`).length)) + chalk.blue('│'));
    }
    
    console.log(chalk.blue('╰────────────────────────────────────────────────────────────────────────╯'));
        }

        if (fell.public) {
            if (!isCreator && m.isGroup)
            return;
        }
        
        switch (command) {
                
            
                
         
                
case "pushkontak": {
if (!isCreator) return;
if (!text || typeof text !== "string") return m.reply(await Func.example(prefix, command, "pesannya"));
const meta = await fell.groupFetchAllParticipating()
let dom = await Object.keys(meta)
global.textpushkontak = text
let list = []
for (let i of dom) {
await list.push({
title: meta[i].subject, 
id: `.respushkontak ${i}`, 
description: `${meta[i].participants.length} Member`
})
}
return fell.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: 'List Grup Chat',
              rows: [...list]              
            }
          ]
        })
      }
      }
  ],
  footer: `© Alfiky`,
  headerType: 1,
  viewOnce: true,
  text: "Pilih Target Grup Pushkontak\n",
  contextInfo: {
   isForwarded: true, 
   mentionedJid: [m.sender, global.owner+"@s.whatsapp.net"], 
  },
}, {quoted: m}) 
}
break

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

case "respushkontak": {
if (!isCreator) return 
if (!text) return 
if (!global.textpushkontak) return
const idgc = text
const teks = global.textpushkontak
const jidawal = m.chat
const data = await fell.groupMetadata(idgc)
const halls = await data.participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
await m.reply(`Memproses *pushkontak* ke dalam grup *${data.subject}*`)

for (let mem of halls) {
if (mem !== botNumber && mem.split("@")[0] !== global.owner) {
await fell.sendMessage(mem, {text: teks}, {quoted: qtoko })
await Func.sleep(global.delayPushkontak)
}}

delete global.textpushkontak
await fell.sendMessage(jidawal, {text: `*Berhasil Pushkontak ✅*\nTotal member berhasil dikirim pesan : ${halls.length}`}, {quoted: m})
}
break
                
                
                case "broadcast": {
    if (!isCreator) return m.reply("Maaf, hanya creator yang dapat menggunakan fitur ini.");
    
    if (args.length < 2) {
        return m.reply(`Cara penggunaan: 
${prefix}${command} [mode] [pesan]

Mode:
- group : Broadcast ke semua grup
- chat  : Broadcast ke semua private chat

Contoh:
${prefix}${command} group Pengumuman penting
${prefix}${command} chat Hai semua`);
    }
    
    const mode = args[0].toLowerCase();
    const broadcastMessage = args.slice(1).join(" ");
    
    if (mode !== "group" && mode !== "chat") {
        return m.reply(`Mode tidak valid. Gunakan "group" atau "chat".`);
    }
    
    if (global.broadcastInProgress) {
        return m.reply("Broadcast sedang berjalan, harap tunggu hingga selesai.");
    }
    global.broadcastInProgress = true;
    
    try {
        let mediaData = m.quoted ? await m.quoted.download() : null;
        let mediaType = mediaData ? m.quoted.mimetype.split('/')[0] : null;
        let count = 0;
        let sentIds = new Set();
        
        if (mode === "group") {
            // Group broadcast (menggunakan groupFetchAllParticipating)
            let allGroups = await fell.groupFetchAllParticipating();
            let groupChats = Object.keys(allGroups);
            
            m.reply(`Mengirim Broadcast ke ${groupChats.length} Grup`);
            
            for (let chatId of groupChats) {
                if (sentIds.has(chatId)) continue;
                await sleep(1500);
                
                let messageContent = { text: `「 Broadcast Group 」\n\n${broadcastMessage}` };
                if (mediaData) {
                    if (mediaType === 'image') {
                        messageContent = { image: mediaData, caption: messageContent.text };
                    } else if (mediaType === 'video') {
                        messageContent = { video: mediaData, caption: messageContent.text };
                    } else if (mediaType === 'audio') {
                        messageContent = { audio: mediaData, mimetype: 'audio/mp4', ptt: !!m.quoted.ptt };
                    } else if (mediaType === 'application') {
                        messageContent = { document: mediaData, mimetype: m.quoted.mimetype, fileName: m.quoted.fileName || 'file', caption: messageContent.text };
                    } else if (m.quoted.mimetype === 'image/webp') {
                        messageContent = { sticker: mediaData };
                    }
                }
                
                try {
                    await fell.sendMessage(chatId, messageContent);
                    sentIds.add(chatId);
                    count++;
                } catch (err) {
                    console.error(`Failed to send to group ${chatId}:`, err.message);
                }
            }
        } else if (mode === "chat") {
            // Chat pribadi broadcast (menggunakan store.chats.all())
            // Perhatikan: Ini berbeda tergantung implementasi store Anda
            let allChats = fell.store.chats.all();
            let privateChats = allChats.filter(c => !c.isGroup);
            
            m.reply(`Mengirim Broadcast ke ${privateChats.length} Chat Pribadi`);
            
            for (let chat of privateChats) {
                let chatId = chat.id;
                if (sentIds.has(chatId)) continue;
                await sleep(1500);
                
                let messageContent = { text: `「 Broadcast Message 」\n\n${broadcastMessage}` };
                if (mediaData) {
                    if (mediaType === 'image') {
                        messageContent = { image: mediaData, caption: messageContent.text };
                    } else if (mediaType === 'video') {
                        messageContent = { video: mediaData, caption: messageContent.text };
                    } else if (mediaType === 'audio') {
                        messageContent = { audio: mediaData, mimetype: 'audio/mp4', ptt: !!m.quoted.ptt };
                    } else if (mediaType === 'application') {
                        messageContent = { document: mediaData, mimetype: m.quoted.mimetype, fileName: m.quoted.fileName || 'file', caption: messageContent.text };
                    } else if (m.quoted.mimetype === 'image/webp') {
                        messageContent = { sticker: mediaData };
                    }
                }
                
                try {
                    await fell.sendMessage(chatId, messageContent);
                    sentIds.add(chatId);
                    count++;
                } catch (err) {
                    console.error(`Failed to send to chat ${chatId}:`, err.message);
                }
            }
        }
        
        m.reply(`*Broadcast Selesai ✅*\nTotal ${mode === "group" ? "grup" : "chat"} yang berhasil dikirim: ${count}`);
    } catch (error) {
        m.reply(`Terjadi kesalahan saat broadcast: ${error.message}`);
    } finally {
        global.broadcastInProgress = false;
    }
}
break;

            default:
                Handler(m, { fell, body, budy, Func, prefixRegex, prefix, isCmd, command, args, text, sender, botNumber, senderNumber, pushname, isBot, fatkuns, quoted, mime, qmsg, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, groupOwner, isGroupOwner })
                if (budy.startsWith('=>')) {
                    if (!isCreator) return
                    function Return(sul) {
                        sat = JSON.stringify(sul, null, 2)
                        bang = require('util').format(sat)
                        if (sat == undefined) {
                            bang = require('util').format(sul)
                        }
                        return m.reply(bang)
                    }
                    try {
                        m.reply(require('util').inspect(await eval(`(async () => { return ${body.slice(2)} })()`)))
                    } catch (e) {
                        m.reply(String(e))
                    }
                }

                if (budy.startsWith('>')) {console.log("eval cuy")
                    if (!isCreator) return
                    let kode = body.slice(1);
                    let teks
                    try {
                        teks = /await/i.test(kode) ? await eval("(async() => { " + kode + " })()") : eval(kode)
                    } catch (e) {
                        teks = e
                    } finally {
                        await m.reply(require('util').inspect(teks))
                    }
                }

                if (budy.startsWith('$')) {
                    if (!isCreator) return
                    exec(budy.slice(2), (err, stdout) => {
                        if (err) return m.reply(`${err}`)
                        if (stdout) return m.reply(stdout)
                    })
                }
                break;
                break;
        }
    } catch (err) {
        console.log(require('util').format(err));
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});
