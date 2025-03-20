const fs = require("fs");
const path = require("path");

const menuPath = path.join(__dirname, "../../Storage/menu.json");

// **Fungsi untuk membaca menu.json**
const loadMenu = () => {
    if (!fs.existsSync(menuPath)) fs.writeFileSync(menuPath, "{}");
    return JSON.parse(fs.readFileSync(menuPath));
};

// **Fungsi untuk menyimpan menu ke menu.json**
const saveMenu = (data) => {
    fs.writeFileSync(menuPath, JSON.stringify(data, null, 2));
};

const handler = async (m, { text, fell }) => {
    const args = text.trim().split(" ");
    const command = args[0];
    const menus = loadMenu();

    // **1️⃣ Jika hanya .menu, tampilkan daftar menu**
    if (!command || command === ".menu") {
        if (Object.keys(menus).length === 0) return m.reply("📂 *Menu kosong! Tambahkan dengan .menu --add <nama> <kategori> <keterangan>*");

        let menuText = "📌 *Daftar Menu Bot*\n\n";
        for (const [name, details] of Object.entries(menus)) {
            menuText += `📂 *${name}*\n🗂️ Kategori: ${details.category}\nℹ️ ${details.description}\n\n`;
        }

        return fell.sendMessage(m.chat, { text: menuText }, { quoted: m });
    }

    // **2️⃣ Tambah menu baru dengan .menu --add <nama> <kategori> <keterangan>**
    if (command === "--add" && args.length >= 4) {
        const name = args[1];
        const category = args[2];
        const description = args.slice(3).join(" ");

        if (menus[name]) return m.reply(`❌ *Menu "${name}" sudah ada!*`);

        menus[name] = { category, description };
        saveMenu(menus);

        return m.reply(`✅ *Menu "${name}" berhasil ditambahkan!*\n🗂️ Kategori: ${category}\nℹ️ ${description}`);
    }

    // **3️⃣ Hapus menu dengan .menu --delete <nama>**
    if (command === "--delete" && args.length === 2) {
        const name = args[1];

        if (!menus[name]) return m.reply(`❌ *Menu "${name}" tidak ditemukan!*`);

        delete menus[name];
        saveMenu(menus);

        return m.reply(`🗑️ *Menu "${name}" berhasil dihapus!*`);
    }

    // **4️⃣ Jika format tidak sesuai**
    return m.reply("⚠️ Format salah!\nGunakan:\n1️⃣ *.menu* → Menampilkan menu\n2️⃣ *.menu --add <nama> <kategori> <keterangan>* → Menambah menu\n3️⃣ *.menu --delete <nama>* → Menghapus menu");
};

handler.command = ["menu"];
handler.tags = ["main"];
module.exports = handler;
