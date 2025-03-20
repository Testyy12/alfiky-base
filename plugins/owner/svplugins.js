const fs = require('fs');
const path = require('path');

let handler = async (m, { text, isCreator }) => {
    if (!isCreator) return m.reply('❌ Kamu bukan owner!');

    const [filename, ...codeParts] = text.split(' ');
    if (!filename || codeParts.length === 0) return m.reply('❌ Format salah! Gunakan:\n.saveplugin <nama>.js/.mjs/.ts <kode>');

    const code = codeParts.join(' ');
    const filePath = path.join(__dirname, `${filename}`);

    try {
        fs.writeFileSync(filePath, code, 'utf8');
        m.reply(`✅ Plugin "${filename}" berhasil disimpan!`);
        global.loadPlugins(); // Reload plugin biar langsung aktif
    } catch (err) {
        console.error('❌ Error saving plugin:', err);
        m.reply('❌ Gagal menyimpan plugin!');
    }
};

handler.command = ["saveplugin"];
handler.owner = true; // Hanya bisa digunakan owner

module.exports = handler;
