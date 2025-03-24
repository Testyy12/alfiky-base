const fs = require('fs');
const path = require('path');

let handler = async (m, { text, isCreator }) => {
    if (!isCreator) return;
    if (!text) return m.reply('❌ Masukkan nama plugin!\nContoh: .getplugin antispam');

    const filePath = path.join(__dirname, `${text}.js`);

    if (!fs.existsSync(filePath)) return m.reply('❌ Plugin tidak ditemukan!');

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        m.reply(`📂 *Kode ${text}.js:*\n\n\`\`\`${content.substring(0, 4000)}\`\`\`\n\n📜 *Note:* Jika kode panjang, bisa cek di PC.`);
    } catch (err) {
        console.error('❌ Error reading plugin:', err);
        m.reply('❌ Gagal membaca plugin!');
    }
};

handler.command = ["getplugin"];
handler.owner = true;

module.exports = handler;
