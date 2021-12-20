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

export default {
    command: ['purse'],
    description: [
        "Check purse and bank account for a player.",
    ],
    options: [
        ...helper.profileOptions
    ],
    usage: '<username> [profile name]',
    call: async obj => {
        const { guildId, client, interaction } = obj;

        let profile;

        try {
            profile = await helper.fetchProfile(interaction);
        } catch(e) {
            return;
        }

        const embed = helper.profileEmbed(profile, 'Purse');

        const { purse, bank } = profile.data;

        return await interaction.editReply({ embeds: [{
            ...embed,
            description: `Purse: ${format(purse)} Coins\n`
            + `Bank: ${bank ? format(bank) + ' Coins' : bold('API disabled')}`
        }] });
    }
};
