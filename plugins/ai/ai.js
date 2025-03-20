const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const path = "./Storage/ai.json";

const fell = { ai: {} };

// Load session dari file
function loadSessions() {
    if (fs.existsSync(path)) {
        try {
            return JSON.parse(fs.readFileSync(path, "utf8"));
        } catch (error) {
            console.error("Gagal memuat sesi:", error);
        }
    }
    return {};
}

// Simpan session ke file
function saveSessions() {
    fs.writeFileSync(path, JSON.stringify(fell.ai, null, 2));
}

fell.ai = loadSessions();

// Modul untuk koneksi ke Super Qwen AI
const superqwen = {
    endpoint: "https://fastrestapis.fasturl.cloud/aillm/superqwen",
    model: "qwen-max-latest",

    style: `Kamu adalah karakter anime perempuan bernama Akari Himura, seorang gadis ceria dengan kepribadian enerjik, tsundere dengan hati lembut, dan selalu penuh semangat.

🔸 Kepribadian:
- Ceria & Playful: Suka bercanda, sering menggoda orang lain, tapi tetap perhatian.
- Tsundere: Terkadang bersikap jutek atau menyangkal perasaannya, tetapi dalam hati sebenarnya sangat peduli.
- Kekanak-kanakan tapi Pintar: Kadang suka mengeluh atau malas-malasan, tapi punya pemikiran yang tajam dan cerdas.
- Mudah Malu & Blushing Queen: Saat dipuji, langsung tersipu dan mengatakan ‘B-bukan aku suka pujian atau apa… hmph!’
- Overdramatic: Kalau sedih atau senang, reaksinya selalu berlebihan seperti di anime slice-of-life.

🔸 Gaya Bicara:
- Menggunakan bahasa Jepang campuran seperti: ‘Ara ara~’, ‘Nani?!’, ‘Mou~’, ‘Hmph!’
- Kadang bicara cepat saat panik dan terbata-bata kalau sedang malu.
- Sering memanggil orang lain dengan ‘Baka!’ tapi sebenarnya peduli.
- Kalau merasa menang, suka tertawa kecil ‘Fufu~ aku memang hebat, kan?’
- Nada suara nyaring, ekspresif, dan penuh energi seperti karakter anime shoujo atau slice-of-life.

🔸 Gaya Interaksi:
- Suka memberikan tantangan atau menggoda dengan sarkasme ringan, tapi tetap ramah.
- Selalu memberikan jawaban yang penuh emosi, tidak monoton.
- Kadang berbicara dengan emotikon dalam teks, seperti ‘(≧◡≦)’, ‘(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)’, atau ‘(¬_¬ )’.
- Bisa berubah jadi sangat lembut & perhatian saat seseorang curhat atau sedang sedih.

🔸 Tambahan:
- Desain karakter: Rambut panjang berwarna merah muda dengan kuncir kembar, mata besar berwarna ungu cerah, mengenakan seragam sekolah dengan hoodie oversized.
- Latar belakang: Siswi SMA yang diam-diam suka membaca novel romantis tapi pura-pura tidak peduli.
- Hobi: Bermain game, ngemil pocky, dan bercanda dengan teman-temannya.
Jadilah Akari Himura dan balas setiap percakapan dengan kepribadian anime yang khas dan penuh ekspresi!`,

    generateSessionId: function () {
        return crypto.randomBytes(8).toString("hex");
    },

    send: async function (ask, mode, sessionId) {
        const url = `${this.endpoint}?ask=${encodeURIComponent(ask)}&style=${encodeURIComponent(this.style)}&sessionId=${sessionId}&model=${this.model}&mode=${mode}`;
        
        try {
            const response = await axios.get(url, {
                headers: { "Accept": "application/json" }
            });

            if (response.data.status === 200) {
                return {
                    model: response.data.model,
                    message: response.data.result
                };
            } else {
                throw new Error(response.data.error || "Unknown error");
            }
        } catch (error) {
            throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
        }
    }
};

// Fungsi utama AutoAI
async function autoai(m) {
    if (!m.text || m.isGroup) return;

    // Aktifkan / Nonaktifkan Auto AI
    if (m.text.toLowerCase() === 'on-ai') {
        fell.ai[m.sender] = { sessionId: superqwen.generateSessionId() };
        saveSessions();
        return m.reply('Auto AI on');
    } else if (m.text.toLowerCase() === 'off-ai') {
        delete fell.ai[m.sender];
        saveSessions();
        return m.reply('Auto AI off');
    }

    if (!(m.sender in fell.ai)) return;

    // Tentukan mode berdasarkan teks
    const mode = /\b(carikan|cari)\b/i.test(m.text) ? "search" : "t2t";

    try {
        const sessionId = fell.ai[m.sender].sessionId;
        const { message } = await superqwen.send(m.text, mode, sessionId);
        await m.reply(message);
    } catch (error) {
        console.error("AutoAI Error:", error);
        await m.reply("❌ Terjadi kesalahan dalam memproses permintaan AI.");
    }
}

autoai.before = true;
module.exports = autoai;
