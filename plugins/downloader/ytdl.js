const yts = require("yt-search");

const handler = async (m, { fell, text }) => {
    if (!text) return m.reply("❌ Masukkan judul lagu!\nContoh: */lagu Alone Alan Walker*");

    try {
        // 🔍 Cari Lagu di YouTube (Scrape dengan `yt-search`)
        const searchResults = await yts(text);
        if (!searchResults.videos.length) return m.reply("❌ Lagu tidak ditemukan!");

        // Ambil 3-4 hasil teratas
        const videos = searchResults.videos.slice(0, 4);

        // Format sebagai Carousel Message (Interactive List)
        const carousel = videos.map(video => ({
            title: video.title,
            description: `🎵 ${video.author.name} | ⏱ ${video.timestamp}`,
            id: `.downloadlagu ${video.url}`, // Nanti user pilih ini
            thumbnailUrl: video.thumbnail
        }));

        // Kirim carousel message
        await fell.sendMessage(m.chat, {
            buttons: [
                {
                    buttonId: "action",
                    buttonText: { displayText: "Pilih Lagu 🎶" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: "🎵 Pilih Lagu dari YouTube",
                            sections: [{ title: "Hasil Pencarian", rows: carousel }]
                        })
                    }
                }
            ],
            footer: "© Alfiky Bot",
            headerType: 1,
            viewOnce: true,
            text: `🔍 *Hasil Pencarian Lagu:*\nKetik */lagu [judul]* untuk mencari lagi!`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });

    } catch (err) {
        console.error(err);
        m.reply("❌ Terjadi kesalahan saat mencari lagu. Coba lagi nanti.");
    }
};

// **Daftarkan perintah plugin**
handler.command = ["lagu", "play"];
handler.tags = ["music"];

// **Export plugin**
module.exports = handler;
