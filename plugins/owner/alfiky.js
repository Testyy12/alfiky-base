const { addIP, delIP } = require("alfiky-pairing");

const handler = async (m, { fell, command, text, isCreator }) => {
    if (!isCreator) return m.reply("❌ Anda tidak memiliki izin untuk mengubah daftar IP!");

    // Pastikan ada input IP
    if (!text) return m.reply(`⚠️ Masukkan IP yang ingin ditambahkan/dihapus!\n\nContoh:\n.addip 192.168.1.1\n.delip 192.168.1.1`);

    // Menjalankan perintah sesuai command
    try {
        if (command === "addip") {
            addIP(text);
            return m.reply(`✅ IP *${text}* berhasil ditambahkan ke daftar yang diperbolehkan!`);
        } else if (command === "delip") {
            delIP(text);
            return m.reply(`✅ IP *${text}* berhasil dihapus dari daftar yang diperbolehkan!`);
        }
    } catch (err) {
        console.error(err);
        return m.reply("❌ Terjadi kesalahan saat mengubah daftar IP.");
    }
};

// **Daftarkan perintah bot**
handler.command = ["addip", "delip"];
handler.tags = ["security"];

// **Export plugin**
module.exports = handler;
