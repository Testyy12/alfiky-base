/**
@credit Tio
@Tixo MD
@Whatsapp Bot
@Support dengan Donasi ✨
wa.me/6282285357346
**/

const  { 
    getBinaryNodeChild, 
    getBinaryNodeChildren, 
    generateWAMessageFromContent, 
    proto 
} = require("@whiskeysockets/baileys");

module.exports = {
    command: "add",
    alias: ["menambahkan", "+"],
    run: async (m, { fell, text, participants, isCreator, isAdmins, prefix, command }) => {
        if (!m.isGroup && !isCreator && !isAdmins) return;

        if (!text && !m.quoted) {
            return m.reply(`Reply pengguna atau masukkan nomor, contoh:\n${prefix + command} +628xxx`);
        }

        let link = await fell.groupInviteCode(m.chat).catch(() => null);
        if (!link) return m.reply("Tidak bisa mendapatkan kode undangan grup.");

        let metadata = await fell.groupMetadata(m.chat).catch(() => null);
        if (!metadata) return m.reply("Gagal mendapatkan informasi grup.");
        
        let groupName = metadata.subject;
        let existingParticipants = metadata.participants.map(user => user.id);
        let inputNumbers = [];

        if (m.quoted) {
            inputNumbers.push(m.quoted.sender.split('@')[0]);
        }

        if (text) {
            inputNumbers = inputNumbers.concat(
                text.split(',')
                    .map(v => v.replace(/[^0-9]/g, ''))
                    .filter(v => v.length > 4 && v.length < 20)
            );
        }

        inputNumbers = [...new Set(inputNumbers)];

        for (const number of inputNumbers) {
            const jid = `${number}@s.whatsapp.net`;

            if (existingParticipants.includes(jid)) {
                await m.reply(`⚠️ Pengguna @${number} sudah ada di grup.`);
                continue;
            }

            const exists = await fell.onWhatsApp(jid);
            if (!exists[0]?.exists) {
                await m.reply(`⚠️ Pengguna @${number} tidak terdaftar di WhatsApp.`);
                continue;
            }

            try {
                const response = await fell.query({
                    tag: 'iq',
                    attrs: { type: 'set', xmlns: 'w:g2', to: m.chat },
                    content: [{ tag: 'add', attrs: {}, content: [{ tag: 'participant', attrs: { jid } }] }],
                });

                const participant = getBinaryNodeChildren(response, 'add');
                const user = participant[0]?.content.find(item => item.attrs.jid === jid);

                if (user?.attrs.error === '421') {
                    m.reply("Tidak dapat menambahkan pengguna ini karena membatasi undangan grup.");
                    continue;
                }

                if (user?.attrs.error === '408') {
                    await m.reply(`✅ Undangan dikirim ke @${number} karena baru keluar dari grup.`);
                    await fell.sendMessage(
                        jid, 
                        { text: `✨ Anda diundang kembali ke grup:\nhttps://chat.whatsapp.com/${link}` }, 
                        { quoted: null }
                    );
                    continue;
                }

                if (user?.attrs.error === '403') {
                    await m.reply(`Mengirim tautan ke @${number}.`);
                    const content = getBinaryNodeChild(user, 'add_request');
                    const { code, expiration } = content.attrs;
                    const pp = await fell.profilePictureUrl(m.chat, 'image').catch(() => null);
                    const jpegThumbnail = pp ? await fetch(pp).then(res => res.buffer()) : Buffer.alloc(0);

                    const msgs = generateWAMessageFromContent(
                        m.chat,
                        proto.Message.fromObject({
                            groupInviteMessage: {
                                groupJid: m.chat,
                                inviteCode: code,
                                inviteExpiration: parseInt(expiration),
                                groupName: groupName,
                                jpegThumbnail: jpegThumbnail.toString("base64"),
                                caption: "Undangan bergabung ke grup WhatsApp",
                            },
                        }), 
                        { userJid: fell.user.id }
                    );

                    await fell.sendMessage(jid, { forward: msgs, mentions: [jid] });
                }
            } catch (err) {
                console.error(err);
                throw err;
            }
        }
    }
};
