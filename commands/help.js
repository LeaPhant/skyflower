const helper = require('../helper.js');

module.exports = {
    command: ['help', 'commands'],
    argsRequired: 0,
    call: obj => {
        const { msg, prefix } = obj;

        const description = 
        `\`${prefix}help\` - Show this help.
        \`${prefix}info\` - Show info and links for this bot.
        \`${prefix}bazaar [amount] <item>\` – Get bazaar prices for an item.
        \`${prefix}skills <user> [profile] [skill]\` – Get skill levels of a player.
        \`${prefix}leaderboard [leaderboard] [u:username] [r:rank] [g:username] [m:mode]\` – Show leaderboards.
        \`${prefix}calendar [event]\` – Show SkyBlock calendar.

        *Run a command without arguments for extended help.*`;

        const fields = [];

        if(msg.member != null
        && msg.member.hasPermission('ADMINISTRATOR')){
            fields.push({
                name: "Admin commands",
                value: 
                `\`s!skyflowerprefix <prefix>\` - Set prefix for this bot (always prefixed with \`s!\`).
                \`${prefix}togglelayout <channel id>\` - Set a channel to toggle extended layout for.

                *(Commands can be run in all channels but use a more compact layout by default, please handle the rest via user permissions).*`
            });
        }

        return { 
            embed: {
                color: helper.mainColor,
                title: "Commands for Sky Flower",
                description,
                fields,
                footer: {
                    icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
                    text: `sky.lea.moe${helper.sep}<> required argument [] optional argument`
                },
            }
        };
    }
};
