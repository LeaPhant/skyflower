import Command from '../command.js';

import helper from '../helper.js';
import config from '../config.json';
import { bold } from '@discordjs/builders';
import LilyWeight from 'lilyweight';
import numeral from 'numeral';

const format = value => {
    return bold(numeral(value).format('0.0'))
};

const lily = new LilyWeight(config.credentials.hypixel_api_key);

class WeightCommand extends Command {
    command = 'weight';
    description = "Calculate lily weight for a player.";
    options = [
        {
            name: 'username',
            description: 'Player to retrieve weight for',
            type: 3,
            required: true
        }
    ];
    example = [
        {
            run: "weight lappysheep",
            result: `Weight for LappySheep.`
        }
    ];
    
    async call(obj) {
        const { interaction } = obj;

        const username = interaction.options.get('username').value;

        await interaction.deferReply();

        const weight = await lily.getWeight(username);

        const embed = {
            color: helper.mainColor,
            url: `https://sky.lea.moe/stats/${weight.uuid}`,
            author: {
                name: `${username}'s Lily Weight`,
                url: `https://sky.lea.moe/stats/${weight.uuid}`,
                icon_url: `https://minotar.net/helm/${weight.uuid}/128`
            },
            fields: []
        };

        embed.fields.push(
            {
                name: 'Skills',
                value: `Base: ${format(weight.skill.base)}
Overflow: ${format(weight.skill.overflow)}`,
                inline: true
            },
            {
                name: 'Catacombs',
                value: `Regular: ${format(weight.catacombs.completion.base)}
Master: ${format(weight.catacombs.completion.master)}
Experience: ${format(weight.catacombs.experience)}`,
                inline: true
            },
            {
                name: 'Slayer',
                value: `Total: ${format(weight.slayer)}`,
                inline: true
            },
            {
                name: 'Total',
                value: `${format(weight.total)} Weight`
            },
            {
                name: 'Links',
                value: '[Lily\'s Discord](https://discord.gg/kXfBmF4) • [Calculator Source](https://github.com/Antonio32A/lilyweight)'
            }
        );

        await interaction.editReply({ embeds: [embed] });
    }
};

export default WeightCommand;
