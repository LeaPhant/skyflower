module.exports = {
    command: ['commandschannel'],
    argsRequired: 1,
    permsRequired: ['ADMINISTRATOR'],
    description: [
        "Change channel to use for commands.",
    ],
    usage: '<channel id>',
    call: async obj => {
        const { argv, msg, db } = obj;

        const channelId = argv[1];

        if(!msg.guild.channels.cache.has(channelId))
            throw "Invalid channel ID";

        const key = `commands_${msg.guild.id}`;
        
        await db.set(key, channelId);

        return `Set commands channel to <#${channelId}>.`;
    }
};