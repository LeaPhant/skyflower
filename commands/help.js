const helper = require('../helper.js');
const config = require('../config.json');

module.exports = {
    command: ['help', 'commands'],
    argsRequired: 0,
    call: obj => {
        const { argv } = obj;

        return { embed: {
            color: 11809405,
            title: "Commands for Robot Lea",
            description:
`\`!bazaar [amount] <item>\` – Get bazaar prices for an item.
\`!skills <user> [profile] [skill]\` – Get skill levels of a player.
\`!owoify [text]\` – owoify a text or the last message.
\`!pack\` – Display info about the pack used on SkyLea.
\`!rules [rule]\` – Show a specific server rule.`
        }};

        //return helper.commandHelp(argv[1]);
    }
};
