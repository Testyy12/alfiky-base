const { proto, getContentType } = require('@whiskeysockets/baileys')
const fs = require('fs')
const { tmpdir } = require("os")
const Crypto = require("crypto")
const ff = require('fluent-ffmpeg')
const webp = require("node-webpmux")
const path = require("path")
const Jimp = require('jimp')
const { spawn } = require('child_process')

function smsg(fell, m, store) {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.sentFrom = /^3A.{18}$/.test(m.id) ? 'ios' : /^3E.{20}$/.test(m.id) ? 'web' : /^(.{21}|.{32})$/.test(m.id) ? 'android' : /^.{18}$/.test(m.id) ? 'desktop' : 'unknown';
        m.isBaileys = m.sentFrom === 'web' || m.sentFrom === 'unknown';
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = fell.decodeJid(m.fromMe && fell.user.id || m.participant || m.key.participant || m.chat || '');
        if (m.isGroup) m.participant = fell.decodeJid(m.key.participant) || '';
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message);
        
        // Enhanced handling of all message types, including nested types
        if (m.mtype === 'viewOnceMessage') {
            const viewType = getContentType(m.message[m.mtype].message);
            m.msg = m.message[m.mtype].message[viewType];
            m.msg.viewOnce = true;
            m.realType = viewType;
        } else if (m.mtype === 'viewOnceMessageV2') {
            const viewType = getContentType(m.message[m.mtype].message);
            m.msg = m.message[m.mtype].message[viewType];
            m.msg.viewOnce = true;
            m.realType = viewType;
        } else if (m.mtype === 'ephemeralMessage') {
            const ephemeralType = getContentType(m.message[m.mtype].message);
            m.msg = m.message[m.mtype].message[ephemeralType];
            m.realType = ephemeralType;
        } else if (m.mtype === 'documentWithCaptionMessage') {
            m.msg = m.message[m.mtype].message.documentMessage;
            m.realType = 'documentMessage';
        } else {
            m.msg = m.message[m.mtype];
            m.realType = m.mtype;
        }
        
        // Complete handling of body text from any message type
        m.body = 
            m.message.conversation || 
            (m.msg && m.msg.caption) || 
            (m.msg && m.msg.text) || 
            (m.mtype === 'listResponseMessage' && m.msg && m.msg.singleSelectReply && m.msg.singleSelectReply.selectedRowId) || 
            (m.mtype === 'buttonsResponseMessage' && m.msg && m.msg.selectedButtonId) || 
            (m.mtype === 'templateButtonReplyMessage' && m.msg && m.msg.selectedId) ||
            '';
        
        // Enhanced quoted message handling
        let quoted = m.quoted = m.msg && m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        m.mentionedJid = m.msg && m.msg.contextInfo ? m.msg.contextInfo.mentionedJid || [] : [];
        
        if (m.quoted) {
            let type = getContentType(quoted);
            
            // Handle nested quoted message types
            if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
                const innerType = getContentType(quoted[type].message);
                m.quoted = quoted[type].message[innerType];
                m.quoted.viewOnce = true;
                m.quoted.mtype = innerType;
            } else if (type === 'ephemeralMessage') {
                const innerType = getContentType(quoted[type].message);
                m.quoted = quoted[type].message[innerType];
                m.quoted.mtype = innerType;
            } else {
                m.quoted = quoted[type];
                m.quoted.mtype = type;
            }
            
            // Handle product messages and other special types
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.sentFrom = /^3A.{18}$/.test(m.quoted.id) ? 'ios' : /^3E.{20}$/.test(m.quoted.id) ? 'web' : /^(.{21}|.{32})$/.test(m.quoted.id) ? 'android' : /^.{18}$/.test(m.quoted.id) ? 'desktop' : 'unknown';
            m.quoted.isBaileys = m.quoted.id ? m.quoted.sentFrom === 'web' || m.quoted.sentFrom === 'unknown' : false;
            m.quoted.sender = fell.decodeJid(m.msg.contextInfo.participant);
            m.quoted.fromMe = m.quoted.sender === (fell.user && fell.user.id);
            
             m.quoted.key = {
                remoteJid: m.quoted.chat,
                fromMe: m.quoted.fromMe,
                id: m.quoted.id
            };
            
            // Enhanced quoted text extraction from any message type
            m.quoted.text = 
                m.quoted.text || 
                m.quoted.caption || 
                m.quoted.conversation || 
                m.quoted.contentText || 
                m.quoted.selectedDisplayText || 
                m.quoted.title || 
                '';
            
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid || [] : [];
            
            // Save the original message structure for viewOnce and other special message types
            m.quoted.rawMessage = quoted;
            
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, fell);
                return exports.smsg(fell, q, store);
            };
            
            let vM = m.quoted.fakeObj = M.fromObject({
                key: { 
                    remoteJid: m.quoted.chat, 
                    fromMe: m.quoted.fromMe, 
                    id: m.quoted.id 
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });
            
            m.quoted.reply = (text, chatId = m.chat, options = {}) => (
                Buffer.isBuffer(text) ? 
                fell.sendFile(chatId, text, "file", "", m.quoted.fakeObj, { ...options }) : 
                fell.sendText(chatId, text, m.quoted.fakeObj, { ...options })
            );
            m.quoted.react = _ => fell.sendMessage(m.chat, {react: {text: _, key: m.quoted.fakeObj.key}});
            m.quoted.delete = () => fell.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.download = () => fell.downloadMediaMessage(m.quoted);
        }
    }
    
    // Add more utility functions and properties
    if (m.msg && m.msg.url) m.download = () => fell.downloadMediaMessage(m.msg);
    m.react = _ => fell.sendMessage(m.chat, {react: {text: _, key: m.key}});
    
    // Enhanced text extraction from any message type
    m.text = 
        (m.mtype === 'conversation' && m.message.conversation) || 
        (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) || 
        (m.msg && m.msg.text) || 
        (m.msg && m.msg.caption) || 
        (m.msg && m.msg.contentText) || 
        (m.msg && m.msg.selectedDisplayText) || 
        (m.msg && m.msg.title) || 
        '';
    
    // Keep a reference to the original message
    m.rawMessage = m.message;
    
    m.reply = (text, chatId = m.chat, options = {}) => (
        Buffer.isBuffer(text) ? 
        fell.sendMedia(chatId, text, "file", "", m, { ...options }) : 
        fell.sendText(chatId, text, m, { ...options })
    );

    return m;
}

async function imageToWebp(media) {
	const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)
	fs.writeFileSync(tmpFileIn, media)
	await new Promise((resolve, reject) => {
		ff(tmpFileIn)
			.on("error", reject)
			.on("end", () => resolve(true))
			.addOutputOptions([
				"-vcodec",
				"libwebp",
				"-vf",
				"scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
			])
			.toFormat("webp")
			.save(tmpFileOut)
	})
	const buff = fs.readFileSync(tmpFileOut)
	fs.unlinkSync(tmpFileOut)
	fs.unlinkSync(tmpFileIn)
	return buff
}

async function videoToWebp(media) {
	const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`)
	fs.writeFileSync(tmpFileIn, media)
	await new Promise((resolve, reject) => {
		ff(tmpFileIn)
			.on("error", reject)
			.on("end", () => resolve(true))
			.addOutputOptions([
				"-vcodec",
				"libwebp",
				"-vf",
				"scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
				"-loop",
				"0",
				"-ss",
				"00:00:00",
				"-t",
				"00:00:05",
				"-preset",
				"default",
				"-an",
				"-vsync",
				"0"
			])
			.toFormat("webp")
			.save(tmpFileOut)
	})
	const buff = fs.readFileSync(tmpFileOut)
	fs.unlinkSync(tmpFileOut)
	fs.unlinkSync(tmpFileIn)
	return buff
}

async function writeExifImg(media, metadata) {
	let wMedia = await imageToWebp(media)
	const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	fs.writeFileSync(tmpFileIn, wMedia)
	if (metadata.packname || metadata.author) {
		const img = new webp.Image()
		const json = { "sticker-pack-id": `https://github.com/KirBotz`, "sticker-pack-name": metadata.packname, "sticker-pack-publisher": metadata.author, "emojis": metadata.categories ? metadata.categories : [""] }
		const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
		const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
		const exif = Buffer.concat([exifAttr, jsonBuff])
		exif.writeUIntLE(jsonBuff.length, 14, 4)
		await img.load(tmpFileIn)
		fs.unlinkSync(tmpFileIn)
		img.exif = exif
		await img.save(tmpFileOut)
		return tmpFileOut
	}
}

async function writeExifVid(media, metadata) {
	let wMedia = await videoToWebp(media)
	const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	fs.writeFileSync(tmpFileIn, wMedia)
	if (metadata.packname || metadata.author) {
		const img = new webp.Image()
		const json = { "sticker-pack-id": `https://github.com/KirBotz`, "sticker-pack-name": metadata.packname, "sticker-pack-publisher": metadata.author, "emojis": metadata.categories ? metadata.categories : [""] }
		const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
		const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
		const exif = Buffer.concat([exifAttr, jsonBuff])
		exif.writeUIntLE(jsonBuff.length, 14, 4)
		await img.load(tmpFileIn)
		fs.unlinkSync(tmpFileIn)
		img.exif = exif
		await img.save(tmpFileOut)
		return tmpFileOut
	}
}

async function writeExif(media, metadata) {
	let wMedia = /webp/.test(media.mimetype) ? media.data : /image/.test(media.mimetype) ? await imageToWebp(media.data) : /video/.test(media.mimetype) ? await videoToWebp(media.data) : ""
	const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
	fs.writeFileSync(tmpFileIn, wMedia)
	if (metadata.packname || metadata.author) {
		const img = new webp.Image()
		const json = { "sticker-pack-id": `https://github.com/KirBotz`, "sticker-pack-name": metadata.packname, "sticker-pack-publisher": metadata.author, "emojis": metadata.categories ? metadata.categories : [""] }
		const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
		const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
		const exif = Buffer.concat([exifAttr, jsonBuff])
		exif.writeUIntLE(jsonBuff.length, 14, 4)
		await img.load(tmpFileIn)
		fs.unlinkSync(tmpFileIn)
		img.exif = exif
		await img.save(tmpFileOut)
		return tmpFileOut
	}
}

function watsappp(buffer, args = [], ext = '', ext2 = '') {
	return new Promise(async (resolve, reject) => {
		try {
			let tmp = path.join(__dirname, '../tmp', + new Date + '.' + ext)
			let out = tmp + '.' + ext2
			await fs.promises.writeFile(tmp, buffer)
			spawn('ffmpeg', [
				'-y',
				'-i', tmp,
				...args,
				out
			])
				.on('error', reject)
				.on('close', async (code) => {
					try {
						await fs.promises.unlink(tmp)
						if (code !== 0) return reject(code)
						resolve({
							data: await fs.promises.readFile(out),
							filename: out,
							delete() {
								return fs.promises.unlink(out)
							}
						})
					} catch (e) {
						reject(e)
					}
				})
		} catch (e) {
			reject(e)
		}
	})
}

function toPTT(buffer, ext) {
	return watsappp(buffer, [
		'-vn',
		'-c:a', 'libopus',
		'-b:a', '128k',
		'-vbr', 'on',
	], ext, 'ogg')
}
function toAudio(buffer, ext) {
	return watsappp(buffer, [
		'-vn',
		'-c:a', 'libopus',
		'-b:a', '128k',
		'-vbr', 'on',
		'-compression_level', '10'
	], ext, 'opus')
}
function toVideo(buffer, ext) {
	return watsappp(buffer, [
		'-c:v', 'libx264',
		'-c:a', 'aac',
		'-ab', '128k',
		'-ar', '44100',
		'-crf', '32',
		'-preset', 'slow'
	], ext, 'mp4')
}
function getGroupAdmins(participants) {
	let admins = [];
	for (let i of participants) {
		if (i.admin === "superadmin" || i.admin === "admin") {
			admins.push(i.id);
		}
	}
	return admins;
}
const jsonformat = (string) => {
	return JSON.stringify(string, null, 2)
}
const generateProfilePicture = async (buffer) => {
	const jimp = await Jimp.read(buffer)
	const min = jimp.getWidth()
	const max = jimp.getHeight()
	const cropped = jimp.crop(0, 0, min, max)
	return {
		img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
		preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
	}
}
const getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "GET",
			url,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (err) {
		return err
	}
}
module.exports = {
	smsg,
	imageToWebp,
	videoToWebp,
	writeExifImg,
	writeExifVid,
	writeExif,
	toPTT,
	toAudio,
	toVideo,
	getGroupAdmins,
	jsonformat,
	generateProfilePicture,
	getBuffer
};

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(`Update ${__filename}`);
	delete require.cache[file]
	require(file)
})
