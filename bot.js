import config from './config.json';
import helper from './helper.js';
import Keyv from 'keyv';
import fs from 'fs/promises';
import { Client, Intents } from 'discord.js';

const commands = [];
const commandFiles = (await fs.readdir('./commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.default);
}

const db = new Keyv(config.dbUri, { namespace: config.dbNamespace });
helper.init(commands, db);

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = commands.find(a => a.command[0] == interaction.commandName);

    if (command == null)
        return;

    const extendedLayout = await helper.extendedLayout(interaction);

    command.call({ interaction, extendedLayout, client });
});

client.login(config.credentials.bot_token);
