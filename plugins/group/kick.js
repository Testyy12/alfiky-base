 const { areJidsSameUser } = require('@whiskeysockets/baileys')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  command: "kick", // Biarkan satu command utama
  alias: ["dor", "piw"], // Pindahkan alias ke sini


  run: async (m, { fell, text, participants, isAdmins, isCreator }) => {
      
      if (!isCreator && m.isGroup && !isAdmins) return;

    let users

    if (m.quoted) {

      users = m.quoted.sender

    } else if (m.mentionedJid[0]) {

      users = m.mentionedJid.filter(u => !areJidsSameUser(u, fell.user.id))

    } else if (!text) return m.reply('reply/tag member')

    let kickedUser = []

    if (m.quoted) {

      await fell.groupParticipantsUpdate(m.chat, [users], 'remove')

    } else {

      for (let user of users) {

        if (user.endsWith('@s.whatsapp.net') && !(participants.find(v => areJidsSameUser(v.id, user)) || { admin: true }).admin) {

          const res = await fell.groupParticipantsUpdate(m.chat, [user], 'remove')

          kickedUser.concat(res)

          await delay(1 * 1000)

        }

      }

    }

    m.reply(`*Sukses Mengeluarkan* ${m.quoted ? m.quoted.sender.split('@')[0] : kickedUser.map(v => '@' + v.split('@')[0])}`, null, { mentions: kickedUser })

  }

}