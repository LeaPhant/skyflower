import Command from '../command.js';
import { channelMention, inlineCode, bold, italic } from '@discordjs/builders';
import helper from '../helper.js';
import { capitalize } from 'lodash-es';

const CHANNEL_OPTION = {
    type: 7,
    name: 'channel',
    description: 'Specify a channel, otherwise applies to current channel'
};

class AdminCommand extends Command {
    command = 'admin';
    description = "Bot customization commands for server admins.";
    options = [
        {
            type: 1,
            name: 'layout',
            description: 'Change layout for responses in channel between extended or compact (default: compact).',
            options: [
                {
                    type: 3,
                    name: 'layout',
                    description: 'Layout type',
                    choices: [
                        {
                            name: 'Extended',
                            value: 'extended'
                        },
                        {
                            name: 'Compact',
                            value: 'compact'
                        }
                    ],
                    required: true
                },
                {
                    type: 5,
                    name: 'default',
                    description: 'Set this as the default layout?'
                },
                CHANNEL_OPTION
            ]
        },
        {
            type: 1,
            name: 'info',
            description: 'Get current configuration for this server.'
        }
    ];

    async call(obj) {
        const { interaction, db } = obj;

        const { guildId } = interaction;

        if (guildId == null) {
            return await interaction.reply({ content: 'This command can only be used in servers.', ephemeral: true });
        }

        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ content: 'Only server admins are allowed to run this command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        let configuration;

        try {
            configuration = JSON.parse(await db.get(`config_${guildId}`));
        } catch(e) {
            configuration = new Object();
        }

        const subCommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        let channelId = channel.id;

        if (interaction.options.getBoolean('default') === true) {
            channelId = 'default';
        }

        let response, color = helper.mainColor;

        try {
            switch (subCommand) {
                case 'layout':
                    response = this.layout(configuration, channelId, interaction);
                    break;
            }
        } catch(e) {
            response = e.message;
            color = helper.errorColor;
        }

        const fields = [];

        if (subCommand == 'info') {
            const defaultLayout = configuration.layout['default']?.type ?? 'compact';
            response = `Default Layout: ${bold(capitalize(defaultLayout))}`;

            let extendedIn = '';

            if (configuration?.layout !== undefined
            && Object.keys(configuration.layout).length > 0) {
                let index = 0;

                for (const channel in configuration.layout) {
                    if (channel == 'default') {
                        continue;
                    }

                    if (configuration.layout[channel]?.type == defaultLayout) {
                        continue;
                    }

                    if (extendedIn.length > 0) {
                        extendedIn += '\n';
                    }

                    extendedIn += channelMention(channel);

                    index++;
                }
            } else {
                extendedIn = italic('empty');
            }

            if (extendedIn.length > 0) {
                fields.push({
                    name: `${defaultLayout == 'compact' ? 'Extended' : 'Compact'} Layout in`,
                    value: extendedIn,
                    inline: true
                });
            }
        }

        const embed = {
            color: color,
            description: response,
            fields
        };

        await db.set(`config_${guildId}`, JSON.stringify(configuration));


        return await interaction.editReply({ embeds: [embed] });
    }

    layout(configuration, channelId, interaction) {
        let response;

        if (configuration?.layout === undefined) {
            configuration.layout = new Object();
        }

        const layoutType = interaction.options.getString('layout');
        const formattedChannel = channelId == 'default' ? 'Default' : channelMention(channelId);

        switch (layoutType) {
            case 'extended':
                if (configuration?.layout[channelId]?.type == 'extended') {
                    throw new Error(`${formattedChannel} already in extended layout.`);
                }

                configuration.layout[channelId] = { type: 'extended' };

                response = `${formattedChannel} has been set to extended layout.`;

                break;
            case 'compact':
                if (configuration?.layout[channelId]?.type == 'compact') {
                    throw new Error(`${formattedChannel} already in compact layout.`);
                    break;
                }

                configuration.layout[channelId] = { type: 'compact' };

                response = `${formattedChannel} has been set to compact layout.`;
        }

        return response;
    }
}

export default AdminCommand;
