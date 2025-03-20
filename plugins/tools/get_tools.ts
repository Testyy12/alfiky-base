// get_tools.ts
import fetch from 'node-fetch';

/**
 * Handler untuk perintah GET
 * Mengambil data dari URL yang diberikan dan mengirimkannya ke chat
 */
function handler(m: any, data: any) {
  // Ekstrak parameter dari data
  const { isCreator, args } = data;
  const fell = data.fell;

  if (!isCreator) return m.reply('❌ Hanya untuk pembuat bot');
  
  return (async () => {
    try {
      const url = args[0];
      
      if (!url) {
        await m.reply('❌ Masukkan URL yang valid\n*Contoh:* !get https://api.example.com/data');
        return;
      }
      
      await fell.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
      
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
  })();
}

// Set properti command
handler.command = 'get';

// Ekspor handler sebagai default
export default handler;