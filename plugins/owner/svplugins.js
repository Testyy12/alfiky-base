const fs = require('fs');
const path = require('path');

module.exports = {
    command: "saveplugin",
    alias: ["savepluginconfirm"],

    run: async (m, { text, isCreator, fell, command }) => {
        if (!isCreator) return m.reply('❌ Kamu bukan owner!');

        const args = text.split(' ');
        if (args.length < 2) {
            return m.reply('❌ Format salah! Gunakan:\n.saveplugin <nama>.js/.mjs <kode>');
        }

        const filename = args.shift();
        const code = args.join(' ');

        const validExtensions = ['.js', '.mjs'];
        if (!validExtensions.includes(path.extname(filename))) {
            return m.reply('❌ Ekstensi file tidak valid! Gunakan .js atau .mjs');
        }

        if (command === "saveplugin") {
            // **Fix Path Folder Plugins**
            const pluginsDir = path.resolve(__dirname, '..'); // Naik 1 level ke `/plugins`
            if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

            let folders = fs.readdirSync(pluginsDir)
                .filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory());
            folders.unshift('plugins'); // Tambahkan pilihan utama di root

            let sections = [{
                title: "📂 Pilih Folder Penyimpanan",
                rows: folders.map(folder => ({
                    title: `📁 ${folder}`,
                    rowId: `.savepluginconfirm ${folder} ${filename} ${code.substring(0, 30)}...`
                }))
            }];

            let listMessage = {
                text: "Pilih folder tempat menyimpan plugin:",
                footer: "📌 Pilih folder yang sesuai.",
                buttonText: "Pilih Folder",
                sections
            };

            return fell.sendMessage(m.chat, listMessage, { quoted: m });
        }

        if (command === "savepluginconfirm") {
            if (args.length < 3) return m.reply('❌ Format salah! Gunakan:\n.savepluginconfirm <folder> <nama>.js/.mjs <kode>');

            let folder = args.shift();
            const filename = args.shift();
            const code = args.join(' ');

            // **Fix Path Folder**
            const pluginsDir = path.resolve(__dirname, '..', folder); // Naik 1 level
            const filePath = path.join(pluginsDir, filename);

            console.log("📂 Path penyimpanan:", pluginsDir);

            if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

            if (fs.existsSync(filePath)) {
                return m.reply(`⚠️ Plugin "${filename}" sudah ada di ${folder}! Hapus dulu jika ingin mengganti.`);
            }

            try {
                fs.writeFileSync(filePath, code, 'utf8');
                m.reply(`✅ Plugin "${filename}" berhasil disimpan di ${pluginsDir}`);

                if (global.loadPlugins) {
                    global.loadPlugins();
                    m.reply('🔄 Plugin telah dimuat ulang!');
                }
            } catch (err) {
                console.error('❌ Error saving plugin:', err);
                m.reply('❌ Gagal menyimpan plugin!');
            }
        }
    }
};
