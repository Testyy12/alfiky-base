const { exec } = require("child_process");

const handler = async (m, { fell, isCreator }) => {
       
    if (!isCreator) {
        return m.reply("❌ *Hanya Owner yang bisa merestart bot!*");
    }

    m.reply("🔄 *Restarting bot...*");

    // Tunggu 2 detik sebelum restart
    setTimeout(() => {
        exec("pm2 restart all", (err, stdout, stderr) => {
            if (err) {
                return m.reply(`❌ Gagal restart bot!\nError: ${err.message}`);
            }
            console.log(stdout);
        });
    }, 2000);
};

handler.command = ["restart", "reboot"];
handler.tags = ["owner"];
module.exports = handler;