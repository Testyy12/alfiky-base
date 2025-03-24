const fetch = require('node-fetch');

module.exports = {
    command: "get",
    alias: ["fetch", "grab"],
    description: "Mengambil data dari URL yang diberikan",
    category: ["tools"],
    settings: { group: false, owner: true },

    run: async (m, data) => {
        const { isCreator, args, fell } = data;

        if (!isCreator) {
            return await m.reply('❌ Hanya untuk pembuat bot');
        }

        const url = args[0];

        if (!url) {
            return await m.reply('❌ Masukkan URL yang valid\n*Contoh:* !get https://api.example.com/data');
        }

        await fell.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        try {
            const response = await fetch(url);
            const contentType = response.headers.get('content-type') || '';
            const fileName = url.split('/').pop() || 'file';

            if (contentType.includes('application/json')) {
                const jsonData = await response.json();
                await fell.sendMessage(m.chat, { text: `🛜 GET Request\n\n📃 Response JSON:\n${JSON.stringify(jsonData, null, 2)}` });
            } else if (contentType.includes('image')) {
                const buffer = await response.arrayBuffer();
                await fell.sendMessage(m.chat, { image: Buffer.from(buffer), caption: '☑️ Response 200 OK ☑️' });
            } else if (contentType.includes('video')) {
                const buffer = await response.arrayBuffer();
                await fell.sendMessage(m.chat, { video: Buffer.from(buffer), caption: '☑️ Response 200 OK ☑️' });
            } else if (contentType.includes('audio')) {
                const buffer = await response.arrayBuffer();
                await fell.sendMessage(m.chat, { audio: Buffer.from(buffer), mimetype: 'audio/mp4', fileName: `${fileName}.mp3` });
            } else if (contentType.includes('application') || contentType.includes('text/csv')) {
                const buffer = await response.arrayBuffer();
                await fell.sendMessage(m.chat, { document: Buffer.from(buffer), mimetype: contentType, fileName });
            } else {
                const responseText = await response.text();
                await fell.sendMessage(m.chat, { text: `🛜 GET Request\n\n📃 Response:\n${responseText}` });
            }

            await fell.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Error in get:', error);
            await m.reply('❌ Gagal melakukan request GET');
            await fell.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
