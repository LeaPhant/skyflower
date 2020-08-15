const helper = require('../helper.js');

module.exports = {
    command: ['help', 'commands'],
    argsRequired: 0,
    call: obj => {
        const { msg, prefix } = obj;

        let description = 
        `\`${prefix}bazaar [amount] <item>\` – Get bazaar prices for an item.
        \`${prefix}skills <user> [profile] [skill]\` – Get skill levels of a player.
        \`${prefix}leaderboard <leaderboard> [u:username] [r:rank]\` – Show leaderboards.
        \`${prefix}help\` - Show this help.
        \`${prefix}info\` - Show info about this bot.`;

        if('member' in msg 
        && msg.member.hasPermission('ADMINISTRATOR'))
            description += '\n\n`!skybotprefix <prefix>` - Set prefix for this bot (admin only)';

        return { 
            embed: {
                color: 11809405,
                title: "Commands for skybot",
                description,
                footer: {
                    icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
                    text: `sky.lea.moe${helper.sep}<> required argument [] optional argument`
                },
            }
        };

        //return helper.commandHelp(argv[1]);
    }
};
