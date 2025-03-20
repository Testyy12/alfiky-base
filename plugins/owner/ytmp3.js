const axios = require("axios");

const handler = async (m, { fell, text }) => {
    if (!text.startsWith("https://")) return m.reply("❌ Link tidak valid! Harap pilih lagu dari menu.");

    try {
        // 🔽 Download Lagu dari YouTube
        const downloadUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(text)}`;
        const downloadRes = await axios.get(downloadUrl);
        if (!downloadRes.data.status) {
            return m.reply("❌ Gagal mendapatkan link download!");
        }

        const { title, dl } = downloadRes.data.data;

        // 📤 Kirim file audio ke WhatsApp
        await fell.sendMessage(m.chat, {
            audio: { url: dl },
            mimetype: "audio/mp4",
            ptt: false // Jika true, akan jadi voice note
        }, { quoted: m });

        m.reply(`🎶 *Lagu:* ${title}\n✅ Berhasil dikirim!`);

    } catch (err) {
        console.error(err);
        m.reply("❌ Terjadi kesalahan saat mendownload lagu. Coba lagi nanti.");
    }
};

handler.command = ["ytmp3","downloadlagu"];
handler.tags = ["music"];

module.exports = handler;