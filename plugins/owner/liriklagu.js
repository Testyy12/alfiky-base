const axios = require("axios");

let handler = async (m, { args }) => {
    let text = args.length ? args.join(" ") : m.quoted?.text;
    if (!text) return m.reply("Masukkan judul lagu! Contoh: .lirik fuwa fuwa time romanized");

    try {
        const { data } = await axios.get(`https://www.archive-ui.biz.id/search/lirik?q=${encodeURIComponent(text)}`, {
            timeout: 10000
        });

        if (!data.status || !data.result) return m.reply("Lirik tidak ditemukan!");

        let pesan = `*🎶 Judul:* ${data.result.title}\n`;
        pesan += `*📀 Album:* ${data.result.album}\n\n`;
        pesan += `📖 *Lirik:*\n${data.result.lyrics}`;

        m.reply(pesan);
    } catch (e) {
        m.reply("Gagal mendapatkan lirik. Coba lagi dengan judul yang lebih spesifik.");
    }
};

handler.command = ['lirik']

module.exports = handler;