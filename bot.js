import config from './config.json' assert { type: 'json' };
import helper from './helper.js';
import Keyv from 'keyv';
import fs from 'fs/promises';
import { Client, Intents } from 'discord.js';
import { parentPort } from 'worker_threads';

const db = new Keyv(config.dbUri, { namespace: config.dbNamespace });
helper.init(db);

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const commands = [];
const commandFiles = (await fs.readdir('./commands')).filter(file => file.endsWith('.js'));

async function reloadCommands() {
    while(commands.length > 0) {
        commands.pop();
    }

    for (const file of commandFiles) {
        const { default: Command } = await import(`./commands/${file}?${Date.now()}`);
        commands.push(new Command(client, helper, db));
    }
}

client.on('interactionCreate', async interaction => {
    try {
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
            command.interact({ interaction, extendedLayout, client, db }).catch(console.error);
        } else if (interaction.isCommand()) {
            if (interaction.commandName == 'reload' 
            && config.owners.includes(interaction.user.id)) {
                try {
                    await client.shard.send('reloadCommands');

                    interaction.reply('Successfully reloaded commands!', { ephemeral: true }).catch(helper.error);
                } catch(e) {
                    helper.error(e);

                    interaction.reply('Failed to reload commands', { ephemeral: true }).catch(helper.error);
                }
                client.shard.send('reloadCommands').catch(helper.error);

                return;
            }

            const command = commands.find(a => a.command == interaction.commandName);
    
            if (command == null)
                return;
    
            const extendedLayout = await helper.extendedLayout(interaction);
    
            command.call({ interaction, extendedLayout, client, commands, db }).catch(err => {
                interaction.reply({ 
                    embeds: [
                        {
                            color: helper.errorColor,
                            author: {
                                name: 'Error'
                            },
                            description: err.message
                        }
                    ],
                    ephemeral: true
                }).catch(() => {}) // we tried
            });
        } else if (interaction.isAutocomplete()) {
            const command = commands.find(a => a.command == interaction.commandName);
    
            if (command == null)
                return;
    
            if (typeof command.autocomplete !== 'function')
                return;
    
            command.autocomplete({ interaction, client }).catch(console.error);
        }
    } catch(e) {
        helper.error(e);
    }
});

parentPort.on('message', message => {
    if (message === 'reloadCommands') {
        reloadCommands().catch(helper.error);
    }
});

reloadCommands().catch(helper.error);

client.login(config.credentials.bot_token);
