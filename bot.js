import config from './config.json';
import helper from './helper.js';
import Keyv from 'keyv';
import fs from 'fs/promises';
import util from 'util';
import { Client, Intents } from 'discord.js';

const db = new Keyv(config.dbUri, { namespace: config.dbNamespace });
helper.init(db);

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const commands = [];
const commandFiles = (await fs.readdir('./commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const { default: Command } = await import(`./commands/${file}`);
    commands.push(new Command(client, helper, db));
}

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const oInteraction = interaction.message.interaction;

        if (interaction.user.id != oInteraction.user.id)
            return;

        const command = commands.find(c => c.command == oInteraction.commandName);

        if (command == null)
            return;

        if (command.interact !== 'function')
            return;

        const extendedLayout = await helper.extendedLayout(interaction);
        command.interact({ interaction, extendedLayout, client}).catch(console.error);
    } else if (interaction.isCommand()) {
        const command = commands.find(a => a.command == interaction.commandName);

        if (command == null)
            return;

        const extendedLayout = await helper.extendedLayout(interaction);

        command.call({ interaction, extendedLayout, client }).catch(console.error);
    } else if (interaction.isAutocomplete()) {
        const command = commands.find(a => a.command == interaction.commandName);

        if (command == null)
            return;

        if (typeof command.autocomplete !== 'function')
            return;

        command.autocomplete({ interaction, client }).catch(console.error);
    }
});

client.login(config.credentials.bot_token);
