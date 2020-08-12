const helper = require('../helper.js');
const config = require('../config.json');

module.exports = {
    command: ['help', 'commands'],
    argsRequired: 0,
    call: obj => {
        const { argv } = obj;

        return { 
            embed: {
                color: 11809405,
                title: "Commands for Robot Lea",
                description:
`\`${config.prefix}bazaar [amount] <item>\` – Get bazaar prices for an item.
\`${config.prefix}skills <user> [profile] [skill]\` – Get skill levels of a player.
\`${config.prefix}leaderboard <leaderboard> [u:username] [r:rank]\` – Show leaderboards.
\`${config.prefix}owoify [text]\` – owoify a text or the last message.
\`${config.prefix}pack\` – Display info about the pack used on SkyLea.
\`${config.prefix}rules [rule]\` – Show a specific server rule.`,
                footer: {
                    icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
                    text: `sky.lea.moe – <> required argument [] optional argument`
                },
            }
        };

        //return helper.commandHelp(argv[1]);
    }
};
