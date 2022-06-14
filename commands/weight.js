import Command from '../command.js';

import helper from '../helper.js';
import { bold } from '@discordjs/builders';
import numeral from 'numeral';

const format = value => {
    return bold(numeral(value).format('0.0'))
};

class WeightCommand extends Command {
    command = 'weight';
    description = "Calculate lily weight for a player.";
    options = [
        ...helper.profileOptions
    ];
    example = [
        {
            run: "weight lappysheep",
            result: `Weight for LappySheep.`
        }
    ];
    
    async call(obj) {
        const { interaction } = obj;

        let profile;

        try {
            profile = await helper.fetchProfile(interaction);
        } catch(e) {
            return;
        }

        const { lilyweight: weight } = profile.data;

        console.log(profile);

        const embed = {
            ...helper.profileEmbed(profile, 'Weight'),
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
