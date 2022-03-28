import Command from '../command.js';
import { channelMention, inlineCode } from '@discordjs/builders';
import helper from '../helper.js';

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
                CHANNEL_OPTION
            ]
        },
        {
            type: 1,
            name: 'allow',
            description: 'Allow the bot in a channel (only applies in allowlist mode).',
            options: [
                {
                    type: 5,
                    name: 'allow',
                    description: 'Whether commands should be enabled in this channel.',
                    required: true,
                },
                CHANNEL_OPTION
            ]
        },
        {
            type: 1,
            name: 'deny',
            description: 'Deny the bot in a channel (only applies in denylist mode).',
            options: [
                {
                    type: 5,
                    name: 'deny',
                    description: 'Whether commands should be disabled in this channel.',
                    required: true
                },
                CHANNEL_OPTION
            ]
        },
        {
            type: 1,
            name: 'mode',
            description: 'Change bot mode between allowlist and denylist (default: denylist).',
            options: [
                {
                    type: 3,
                    name: 'mode',
                    description: 'Mode for this server.',
                    choices: [
                        {
                            name: 'Denylist – commands enabled in all channels by default',
                            value: 'denylist'
                        },
                        {
                            name: 'Allowlist – commands disabled in all channels by default',
                            value: 'allowlist'
                        }
                    ],
                    required: true
                }
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

        await interaction.deferReply({ ephemeral: true });

        let configuration;

        try {
            configuration = JSON.parse(await db.get(`config_${guildId}`));
        } catch(e) {
            configuration = new Object();
        }

        const subCommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const channelId = channel.id;

        let response, color = helper.mainColor;

        try {
            switch (subCommand) {
                case 'layout':
                    response = this.layout(configuration, channelId, interaction);
                    break;
                case 'allow':
                    response = this.allow(configuration, channelId, interaction);
                    break;
                case 'deny':
                    response = this.deny(configuration, channelId, interaction);
                    break;
                case 'mode':
                    response = this.mode(configuration, interaction);
                    break;
            }
        } catch(e) {
            response = e.message;
            color = helper.errorColor;
        }

        const embed = {
            color: color,
            description: response
        }

        await db.set(`config_${guildId}`, JSON.stringify(configuration));
        
        console.log(configuration);

        return await interaction.editReply({ embeds: [embed] });
    }

    layout(configuration, channelId, interaction) {
        let response;

        if (configuration?.layout === undefined) {
            configuration.layout = new Object();
        }

        const layoutType = interaction.options.getString('layout');

        switch (layoutType) {
            case 'extended':
                if (configuration?.layout[channelId]?.type == 'extended') {
                    throw new Error(`${channelMention(channelId)} already in extended layout.`);
                }

                configuration.layout[channelId] = { type: 'extended' };

                response = `${channelMention(channelId)} has been set to extended layout.`;

                break;
            case 'compact':
                if (!Object.keys(configuration.layout).includes(channelId)) {
                    throw new Error(`${channelMention(channelId)} already in compact layout.`);
                    break;
                }

                response = `${channelMention(channelId)} has been set to compact layout.`;

                delete configuration.layout[channelId];
        }

        return response;
    }
    
    allow(configuration, channelId, interaction) {
        let response;

        if (Array.isArray(configuration?.allowlist) == false) {
            configuration.allowlist = new Array();
        }

        const entryExists = configuration.allowlist.includes(channelId);
        const allow = interaction.options.getBoolean('allow');

        if (allow) {
            if (entryExists) {
                throw new Error(`${helper.botName} is already allowed in ${channelMention(channelId)}.`);
            }

            response = `${helper.botName} has been allowed in ${channelMention(channelId)}.`;

            configuration.allowlist.push(channelId);
        } else {
            if (!entryExists) {
                throw new Error(`${helper.botName} is already not allowed in ${channelMention(channelId)}.`);
            }

            response = `${helper.botName} is no longer allowed in ${channelMention(channelId)}.`;

            const entryIndex = configuration.allowlist.indexOf(channelId);

            configuration.allowlist.splice(entryIndex, 1);
        }

        if (configuration?.mode == 'denylist') {
            response += '\n\nNote: this currently has no effect as the bot is in denylist mode.'
        }

        return response;
    }

    deny(configuration, channelId, interaction) {
        let response;

        if (Array.isArray(configuration?.denylist) == false) {
            configuration.denylist = new Array();
        }

        const entryExists = configuration.denylist.includes(channelId);
        const deny = interaction.options.getBoolean('deny');

        if (deny) {
            if (entryExists) {
                throw new Error(`${helper.botName} is already denied in ${channelMention(channelId)}.`);
            }

            response = `${helper.botName} has been denied in ${channelMention(channelId)}.`

            configuration.denylist.push(channelId);
        } else {
            if (!entryExists) {
                throw new Error(`${helper.botName} is already not denied in ${channelMention(channelId)}.`);
            }

            response = `${helper.botName} is no longer denied in ${channelMention(channelId)}.`

            const entryIndex = configuration.denylist.indexOf(channelId);

            configuration.denylist.splice(entryIndex, 1);
        }

        if (configuration?.mode == 'allowlist') {
            response += '\n\nNote: this currently has no effect as the bot is in allowlist mode.'
        }

        return response;
    }

    mode(configuration, interaction) {
        const mode = interaction.options.getString('mode');
        const currentMode = configuration?.mode ?? 'denylist';

        if (currentMode == mode) {
            throw new Error(`${helper.botName} is already in ${mode} mode.`);
        }

        configuration.mode = mode;

        let response = `${helper.botName} has been set to ${mode} mode.`;

        if (mode == 'allowlist') {
            response += `\n\nCommands are now disabled by default in all channels.`;
            response += `\nUse ${inlineCode('/admin allow')} to enable the bot in specific channels.`;
        } else {
            response += `\n\nCommands are now enabled by default in all channels.`;
            response += `\nUse ${inlineCode('/admin deny')} to disable the bot in specific channels.`;
        }

        return response;
    }
}

export default AdminCommand;
