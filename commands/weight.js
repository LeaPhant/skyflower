const helper = require('../helper');
const config = require('../config.json');
const LilyWeight = require("lilyweight");
const numeral = require('numeral');

const lily = new LilyWeight(config.credentials.hypixel_api_key);

module.exports = {
    command: ['weight', 'lilyweight'],
    description: [
        "Calculate lily weight for a player.",
    ],
    argsRequired: 1,
    usage: '[username]',
    example: [
        {
            run: "weight lappysheep",
            result: `Weight for LappySheep.`
        }
    ],
    call: async obj => {
        const { argv, endEmitter } = obj;

        const username = argv[1];

        const weight = await lily.getWeight(username);

        const embed = {
            color: helper.mainColor,
                url: `https://sky.lea.moe/stats/${weight.uuid}`,
                author: {
                    name: `${username}'s Lily Weight`,
                    url: `https://sky.lea.moe/stats/${weight.uuid}}`,
                    icon_url: `https://minotar.net/helm/${weight.uuid}/128`
                },
                fields: []
        };

        embed.fields.push(
            {
                name: 'Skills',
                value: `Base: **${numeral(weight.skill.base).format('0.0')}**
Overflow: **${numeral(weight.skill.overflow).format('0.0')}**`,
                inline: true
            },
            {
                name: 'Catacombs',
                value: `Regular: **${numeral(weight.catacombs.completion.base).format('0.0')}**
Master: **${numeral(weight.catacombs.completion.master).format('0.0')}**
Experience: **${numeral(weight.catacombs.experience).format('0.0')}**`,
                inline: true
            },
            {
                name: 'Slayer',
                value: `Total: **${numeral(weight.slayer).format('0.0')}**`,
                inline: true
            },
            {
                name: 'Total',
                value: `**${numeral(weight.total).format('0.0')}** Weight`
            },
            {
                name: 'Links',
                value: '[Lily\'s Discord](https://discord.gg/kXfBmF4) • [Calculator Source](https://github.com/Antonio32A/lilyweight)'
            }
        );

        return { embed };
    }
};