const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");

const configPath = path.join(__dirname, "../../Storage/gh.json"); // ✅ Path Absolut

const handler = async (m, { text, fell, isCreator, command }) => {
    if (!isCreator) {
        return m.reply("❌ *Hanya Owner yang bisa menggunakan perintah ini!*");
    }

    if (command === "setgit") {
        // **Konfigurasi GitHub (setgit)**
        const args = text.split("|").map((s) => s.trim());
        if (args.length !== 3) {
            return m.reply(`⚠️ *Format salah!*\nGunakan:\n*/setgit username | email | repo_url+token*\n\nContoh:\n*/setgit alfikyid | alfiky@gmail.com | https://TOKEN@github.com/alfikyid/bot-whatsapp.git*`);
        }

        const [username, email, repoUrl] = args;

        // **Pastikan folder Storage ada sebelum menyimpan konfigurasi**
        const folderPath = path.dirname(configPath);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        fs.writeFileSync(configPath, JSON.stringify({ repoUrl }, null, 2)); // Simpan repo URL ke JSON

        // **Pastikan repository Git sudah diinisialisasi**
        if (!fs.existsSync(".git")) {
            try {
                execSync("git init"); // **Gunakan execSync agar git init selesai sebelum lanjut**
                execSync("git branch -m main"); // **Ubah branch default ke 'main'**
                console.log("✅ Git repository berhasil diinisialisasi.");
            } catch (err) {
                return m.reply(`❌ *Gagal menjalankan git init!*\nError: ${err.message}`);
            }
        }

        // **Pastikan remote origin sudah ada**
        exec("git remote -v", (err, stdout, stderr) => {
            if (!stdout.includes("origin")) {
                console.log("🌐 Menambahkan remote origin...");
                execSync(`git remote add origin ${repoUrl}`);
            }
        });

        // **Konfigurasi username & email**
        exec(
            `git config --global user.name "${username}" && git config --global user.email "${email}"`,
            (err, stdout, stderr) => {
                if (err) {
                    return m.reply(`❌ *Gagal mengatur GitHub!*\nError: ${stderr || err.message}`);
                }
                m.reply(`✅ *Bot berhasil terhubung ke GitHub!*\n👤 Username: ${username}\n📧 Email: ${email}\n🔗 Repo: ${repoUrl}`);
            }
        );

    } else if (command === "pushgit") {
        // **Push ke GitHub (pushgit)**
        if (!fs.existsSync(configPath)) {
            return m.reply("⚠️ *Bot belum dikonfigurasi ke GitHub!*\nGunakan */setgit* terlebih dahulu.");
        }

        const config = JSON.parse(fs.readFileSync(configPath));
        if (!config.repoUrl) {
            return m.reply("⚠️ *Konfigurasi GitHub tidak valid!*\nGunakan */setgit* ulang.");
        }

        const commitMessage = text ? text.trim() : "Update via WhatsApp Bot";

        // **Cek apakah folder sudah diinisialisasi Git**
        if (!fs.existsSync(".git")) {
            return m.reply("⚠️ *Repository belum diinisialisasi!*\nGunakan */setgit* dulu.");
        }

        // **Cek apakah ada perubahan sebelum push**
        exec("git status --porcelain", (err, stdout, stderr) => {
            if (err) {
                return m.reply(`❌ *Gagal menjalankan git status!*\nError: ${stderr || err.message}`);
            }
            if (!stdout.trim()) {
                return m.reply("⚠️ *Tidak ada perubahan untuk di-push!*");
            }

            m.reply("⏳ *Menyiapkan push ke GitHub...*");

            // **Dapatkan branch aktif secara otomatis**
            exec(
                `git add . && git commit -m "${commitMessage}" && git push origin $(git branch --show-current)`,
                (err, stdout, stderr) => {
                    if (err) {
                        return m.reply(`❌ *Gagal push ke GitHub!*\nError: ${stderr || err.message}`);
                    }
                    m.reply(`✅ *Push ke GitHub berhasil!*\n📝 Commit: ${commitMessage}`);
                }
            );
        });
    }
};

handler.command = ["setgit", "pushgit"];
handler.tags = ["owner"];
module.exports = handler;
