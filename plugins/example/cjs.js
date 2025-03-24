// plugins/help.js
module.exports = {
    command: "help",
    alias: ["bantuan", "menu"],
    run: async (m, data) => {
        await m.reply("📜 Ini daftar perintah...");
    }
};
