import Command from '../command.js';

import helper from '../helper.js';
import { time, bold } from '@discordjs/builders';
import { startCase } from 'lodash-es';

class DailiesCommand extends Command {
    command = 'dailies';
    description = "Check daily Crimson Isle faction quests.";
    options = helper.profileOptions;

    async call(obj) {
        const { interaction } = obj;

        let profile;

        try {
            profile = await helper.fetchProfile(interaction);
        } catch(e) {
            return;
        }

        const embed = helper.profileEmbed(profile, 'Faction Dailies');

        let description = `Last update: ${time(new Date(profile.raw.last_save), 'R')}\n`;

        const questData = profile.raw?.nether_island_player_data?.quests?.quest_rewards;
        const questList = profile.raw?.nether_island_player_data?.quests?.quest_data?.quest_list;

        if (questList == null) {
            description = 'Player has no available faction quests.';
        }

        const quests = [];

        for (const quest of questList) {
            const reward = questData[quest];
            let name = startCase(quest.replace('crimson_isle_', ''));

            name = name.substring(0, name.length - 1) + '(' + name.substring(name.length - 1) + ')';

            quests.push({
                quest: name,
                reward: startCase(reward.toLowerCase()),
                amount: questData[reward]
            });
        }

        console.log(quests);

        for (const quest of quests) {
            description += `\n${quest.quest} ${helper.sep} ${bold(quest.amount + 'x ' + quest.reward)}`
        }

        console.log(description);

        return await interaction.editReply({ embeds: [{
            ...embed,
            description
        }] });
    }
}

export default DailiesCommand;
