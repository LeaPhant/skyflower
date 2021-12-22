import Command from '../command.js';

import helper from '../helper.js';
import config from '../config.json';
import fetch from 'node-fetch';
import numeral from 'numeral';
import { bold } from '@discordjs/builders';

const format = n => {
    let output;

    if (n < 1_000) {
        output = Math.floor(n);
    } else if (n < 1_000_000_000) {
        output = numeral(n).format('0.0a');
    } else {
        output = numeral(n).format('0.00a');
    }

    return bold(output);
};

class PurseCommand extends Command {
    command = 'purse';
    description = "Check purse and bank account for a player.";
    options = helper.profileOptions;

    async call(obj) {
        const { guildId, client, interaction } = obj;

        let profile;

        try {
            profile = await helper.fetchProfile(interaction);
        } catch(e) {
            return;
        }

        const embed = helper.profileEmbed(profile, 'Purse');

        const { purse, bank } = profile.data;

        embed.fields = [
            {
                name: 'Purse',
                value: `${format(purse)} Coins`,
                inline: true
            }, {
                name: 'Bank',
                value: `${bank ? format(bank) + ' Coins' : bold('API disabled')}`,
                inline: true
            }
        ];

        return await interaction.editReply({ embeds: [embed] });
    }
};

export default PurseCommand;
