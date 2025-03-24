function runtime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

module.exports = {
command: "ping",
alias: ['test-bot'],
run: async (m, { fell }) => {


let upem = `Runtime: ${runtime(process.uptime())}`;
m.reply(upem);

}}