import fs from "fs";
import os from "os";
import { performance } from "perf_hooks";
import { sizeFormatter } from "human-readable";

// Formatter untuk ukuran file
const format = sizeFormatter({
  std: "JEDEC",
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal}B`,
});

// Path untuk menyimpan uptime
const RUNTIME_FILE = "./Storage/runtime.json";

// Cek apakah file runtime sudah ada
let startTime: number;
if (fs.existsSync(RUNTIME_FILE)) {
  const savedData = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf-8"));
  startTime = savedData.startTime;
} else {
  startTime = Date.now();
  fs.writeFileSync(RUNTIME_FILE, JSON.stringify({ startTime }));
}


const handler = async (m: MessageData, data: HandlerData) => {
 

  const { fell, Func } = data;
  const uptimeMs = Date.now() - startTime; // Hitung uptime sejak pertama kali bot nyala

  const old = performance.now();
  const neww = performance.now();
  const speed = neww - old;

  const cpuModel = os.cpus()[0].model;
  const OS = os.platform();
  const hostname = os.hostname();
  const freeRAM = format(os.freemem());
  const totalRAM = format(os.totalmem());

  await m.reply("_Testing speed..._");

  const txt = `*ᴘ ɪ ɴ ɢ*
${Math.round(neww - old)} ms
${speed.toFixed(2)} ms

*ʀ ᴜ ɴ ᴛ ɪ ᴍ ᴇ* 
${clockString(uptimeMs)}

*s ᴇ ʀ ᴠ ᴇ ʀ*
*🛑 ʀᴀᴍ:* ${totalRAM}
*🔵 ғʀᴇᴇRAM:* ${freeRAM}
*🔴 ᴄᴘᴜ:* ${cpuModel}
*🔭 ᴘʟᴀᴛғᴏʀᴍ:* ${OS}
*🧿 sᴇʀᴠᴇʀ:* ${hostname}
`;

  await fell.sendMessage(m.chat, {
    text: txt,
  });
};

// Fungsi untuk format uptime ke `DD HH MM SS`
function clockString(ms: number) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}D ${h}H ${m}M ${s}S`;
}

// Ekspor handler
export default handler;

// Konfigurasi command
handler.command = ["ping", "speed"];
handler.tags = ["info"];
