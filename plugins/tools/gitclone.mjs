import fetch from 'node-fetch';

let handler = async (m, { fell, text, args, prefix, command }) => {
    if (!args[0]) {
        return fell.sendMessage(m.chat, {
            text: `⚠️ *Contoh Penggunaan:*\n${prefix}${command} kannachann/kannabot-md`,
        }, { quoted: m });
    }

    let [usr, rep] = text.split('/');
    if (!usr || !rep) {
        return fell.sendMessage(m.chat, {
            text: `❌ *Format salah!*\nGunakan: ${prefix}${command} username/repo`,
        }, { quoted: m });
    }

    let url = `https://api.github.com/repos/${encodeURIComponent(usr)}/${encodeURIComponent(rep)}/zipball`;
    let name = `${encodeURIComponent(rep)}.zip`;

    await fell.sendMessage(m.chat, { text: `📥 *Mengunduh file...*` }, { quoted: m });

    try {
        await fell.sendMessage(m.chat, {
            document: { url },
            mimetype: 'application/zip',
            fileName: name,
            caption: `✅ *Berhasil mengunduh repo!*\n📂 *Nama:* ${name}`,
        }, { quoted: m });
    } catch (error) {
        console.error(error);
        await fell.sendMessage(m.chat, {
            text: `❌ *Gagal mengunduh repository!*\nCek apakah repo benar atau tidak.`,
        }, { quoted: m });
    }
};

handler.description = ['gitclone <username>/<repo>'];
handler.alias = ['downloader'];
handler.command = /gitclone/i;

export default handler;
