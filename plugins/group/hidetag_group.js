let handler = async (m, { args, isCreator, fell }) => {
    if (!isCreator) return;
    if (args.length < 2) return m.reply("use the command hidetag id@g.us text");

    let groupJid = args[0]; // The first argument is the group ID
    let message = args.slice(1).join(" "); // The rest of the arguments form the message

    let groupMetadata = await fell.groupMetadata(groupJid);
    let users = groupMetadata.participants.map(user => user.id);

    await fell.sendMessage(groupJid, {
        text: `@${groupJid} ${message}`,
        contextInfo: { mentionedJid: users,
            groupMentions: [{
                groupSubject: 'everyone',
                groupJid: groupJid
            }],
         },
        
    }, { quoted: m });
};

// Example usage
handler.command = ["hidetag"]; // Only allow the owner to use this command

module.exports = handler;