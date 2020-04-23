const helper = require('../helper.js');
const config = require('../config.json');

module.exports = {
    command: 'help',
    argsRequired: 0,
    description: [
        "Get help for a command.",
        "",
        "**List of all commands:** https://github.com/LeaPhant/skybot/blob/master/COMMANDS.md"
    ],
    usage: '<command>',
    example: [
        {
            run: "help bazaar",
            result: `Returns help on how to use the \`${config.prefix}bazaar\` command.`
        }
    ],
    call: obj => {
        const { argv } = obj;

        return "You can't be helped.";

        //return helper.commandHelp(argv[1]);
    }
};
