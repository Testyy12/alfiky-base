const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

/**
 * Plugin Backup Script Bot
 * - Membuat file ZIP dari semua script bot
 * - Mengirim ZIP ke pengguna
 * - Menghapus file backup setelah dikirim
 */

async function handler(m, { isCreator, fell }) {
    if (!isCreator) return m.reply("❌ *Hanya pemilik bot yang bisa melakukan backup!*");

    await m.reply("📦 *Memproses backup script bot...*");

    try {
        // **1️⃣ Pastikan Folder Sementara Ada**
        const tempDir = path.join(__dirname, "../../tmp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // **2️⃣ Nama File Backup**
        const zipName = `=backup-alfiky-base.zip`;
        const zipPath = path.join(tempDir, zipName);

        console.log(`📂 Membuat backup file: ${zipPath}`);

        // **3️⃣ List Semua File & Folder Kecuali yang Dikecualikan**
        const exclude = ["node_modules", "session", "package-lock.json", "yarn.lock"];
        const ls = execSync("ls").toString().split("\n").filter(file => !exclude.includes(file) && file !== "");

        if (ls.length === 0) {
            return m.reply("❌ *Tidak ada file yang bisa di-backup!*");
        }

        // **4️⃣ Buat ZIP**
        execSync(`zip -r ${zipPath} ${ls.join(" ")}`);

        // **5️⃣ Cek Apakah ZIP Berhasil Dibuat**
        if (!fs.existsSync(zipPath)) {
            return m.reply("❌ *Gagal membuat backup!*");
        }

        // **6️⃣ Kirim File ZIP ke User**
        await fell.sendMessage(m.sender, {
            document: fs.readFileSync(zipPath),
            fileName: zipName,
            mimetype: "application/zip"
        }, { quoted: m });

        console.log("📤 Backup berhasil dikirim!");

        // **7️⃣ Hapus ZIP Setelah Dikirim**
        fs.unlink(zipPath, (err) => {
            if (err) console.error("❌ Gagal menghapus ZIP:", err);
            else console.log("🗑️ Backup berhasil dihapus.");
        });

        if (m.chat !== m.sender) {
            return m.reply("✅ *Script bot berhasil dikirim ke private chat!*");
        }

    } catch (error) {
        console.error("❌ ERROR Backup:", error);
        await m.reply(`❌ *Backup gagal:* ${error.message}`);
    }
}

// **Daftarkan perintah plugin**
handler.command = ["getsc"];
handler.tags = ["tools"];
handler.help = ["getsc - Backup script bot"];

// **Export plugin**
module.exports = handler;
