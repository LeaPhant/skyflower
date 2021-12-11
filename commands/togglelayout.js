export default {
    command: ['togglelayout'],
    argsRequired: 1,
    permsRequired: ['ADMINISTRATOR'],
    description: [
        "Toggle extended layout for a channel.",
    ],
    usage: '<channel id>',
    call: async obj => {
        const { argv, msg, db } = obj;

        const channelId = argv[1];

        if(!msg.guild.channels.cache.has(channelId))
            throw "Invalid channel ID";

        const key = `layout_${msg.guild.id}_${channelId}`;

        const layout = await db.get(key) || 'basic';
        const newLayout = layout == 'basic' ? 'extended' : 'basic';
        
        await db.set(key, newLayout);

        return `Extended layout ${layout == 'basic' ? 'enabled' : 'disabled'} for channel <#${channelId}>.`;
    }
};
