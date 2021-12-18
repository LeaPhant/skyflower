import config from './config.json';
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
    const command = await import(`./commands/${file}`);
    commands.push(command.default);
}

const rest = new REST({ version: '9' }).setToken(TOKEN);

const commandPayload = [];

for (const c of commands) {
    const command = {
        name: c.command[0],
        description: c.description[0],
        type: c?.type ?? 1,
        default_permission: false
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

    for (const guild of config.test_guilds) {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guild),
            { body: commandPayload },
        );
    }

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}
