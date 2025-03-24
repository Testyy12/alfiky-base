const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

let handler = async (m, { fell, isCreator }) => {
if (!isCreator) return;
    if (!m.quoted || (!m.quoted.mtype.includes('imageMessage') && !m.quoted.mtype.includes('videoMessage') && !m.quoted.mtype.includes('audioMessage'))) {

        return m.reply(`Reply media view once`);

    }

    let media = await m.quoted.download();

    let type = m.quoted.mtype.includes('videoMessage') ? 'video' : m.quoted.mtype.includes('imageMessage') ? 'image' : 'audio';

    let fileName = type === 'video' ? 'media.mp4' : type === 'image' ? 'media.jpg' : 'media.mp3';

    return fell.sendFile(m.chat, media, fileName, m.quoted.caption || '', m);

}


handler.command = ["rvo", "readviewonce"];

module.exports = handler;
