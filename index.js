import config from './config.json' assert { type: 'json' };
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import fs from 'fs/promises';
import { ShardingManager } from 'discord.js';

if (!config.credentials.bot_token)
    throw "Please provide a Discord bot token";

const CLIENT_ID = config.credentials.discord_client_id;
const TOKEN = config.credentials.bot_token;

const commands = [];
const commandFiles = (await fs.readdir('./commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const { default: Command } = await import(`./commands/${file}`);
    commands.push(new Command());
}

const rest = new REST({ version: '9' }).setToken(TOKEN);

const commandPayload = [];

for (const c of commands) {
    const command = {
        name: c.command,
        description: c.description,
        type: c?.type ?? 1,
        defaultPermission: true
    };

    if (c.hasOwnProperty('permsRequired') && c.permsRequired.length > 0) {
        command.defaultPermission = false;
    }

    if (c.hasOwnProperty('options')) {
        command.options = c.options;
    } else if (c?.argsRequired !== undefined && c.argsRequired > 0) {
        command.options = [
            {
                name: 'query',
                description: 'Query for the command.',
                type: 3,
                required: true
            }
        ];
    }

    commandPayload.push(command);
}

const manager = new ShardingManager('./bot.js', { token: config.credentials.bot_token, mode: 'worker' });

manager.spawn();
manager.on('shardCreate', shard => {
    shard.on('message', message => {
        if (typeof message == 'string')
            manager.broadcast(message)
    });

    console.log(`Launched shard ${shard.id}`);
});

try {
    console.log('Started refreshing application (/) commands.');

    const guildCommandPayload = [
        ...commandPayload,
        {
            name: 'reload',
            description: 'Reload command files',
            type: 1,
            defaultPermission: true
        }
    ];

    if (config?.owner_guild != null) {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, config.owner_guild),
            { body: guildCommandPayload },
        );
    }

    await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commandPayload },
    );

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}

