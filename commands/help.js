import Command from '../command.js';

import helper from '../helper.js';
import { inlineCode } from '@discordjs/builders';

class HelpCommand extends Command {
    command = 'help';
    description = "Get an overview of all commands.";

    async call(obj) {
        const { interaction, commands } = obj;

        let description = '';

        for (const [index, command] of commands.entries()) {
            if (index > 0) {
                description += '\n';
            }

            description += `${inlineCode(`/${command.command}`)}: ${command.description}`;
        }

        const embed = {
            color: helper.mainColor,
            title: "Commands for Sky Flower",
            description,
            image: {
                url: 'https://cdn.discordapp.com/attachments/572429763700981780/928208027109183548/footer-wide.png'
            }
        };

        return await interaction.reply({ embeds: [embed] });
    }
}

export default HelpCommand;
