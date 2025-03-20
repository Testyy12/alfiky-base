

let handler = async (m, data) => {
    const { fell } = data;
    m.reply('This is the menu');
};

handler.command = ['alo']

export default handler;