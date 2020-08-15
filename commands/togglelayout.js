module.exports = {
    command: ['togglelayout'],
    argsRequired: 1,
    permsRequired: ['ADMINISTRATOR'],
    description: [
        "Toggle extended layout for a channel.",
    ],
    usage: '<channel mention>',
    call: async obj => {
        const { argv, msg, db } = obj;

        const channelId = argv[1].substring(2, argv[1].length - 1);

        console.log(channelId);

        const key = `layout_${msg.guild.id}_${channelId}`;

        const layout = await db.get(key) || 'basic';
        const newLayout = layout == 'basic' ? 'extended' : 'basic';
        
        await db.set(key, newLayout);

        return `Extended layout ${layout == 'basic' ? 'enabled' : 'disabled'} for channel ${argv[1]}.`;
    }
};