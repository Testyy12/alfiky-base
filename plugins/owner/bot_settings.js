

let handler = async (m, {fell, isCreator, text, Func, command }) => {
    switch (command){
        case 'mode':
            if (!isCreator) return m.reply('Kamu bukan owner!')
         if (!text) return m.reply(Func.example(' public/self'))

            mode = text.toLowerCase()

            if (mode === 'public') {
                fell.public = true
                m.reply('Berhasil mengubah mode ke public!')
            } else if (mode === 'self') {
                fell.public = false
                m.reply('Berhasil mengubah mode ke self!')
            }
            break

            case 'status-bot': 
            if (!isCreator) return m.reply('Kamu bukan owner!')

                m.reply(`*Status Bot:*\n- Mode: ${fell.public === true ? 'Public' : fell.public === false ? 'self' : 'Public'}`)
                break
    }

    

}

handler.command = ['mode', 'status-bot']

module.exports = handler