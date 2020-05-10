const Discord = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const helper = require('./helper.js');

const client = new Discord.Client({autoReconnect:true});

client.on('error', console.error);

const config = require('./config.json');

let guilds = [];

client.on('ready', () => {
    for(const guild of client.guilds.cache.array())
        if(guild.me.hasPermission('MANAGE_EMOJIS'))
            guilds.push(guild);

    if(guilds.length == 0)
        throw "Bot has no servers to upload emotes to";

    for(const [index, guild] of guilds.entries()){
        const staticEmojis = guild.emojis.cache.filter(a => !a.animated && !a.deleted && !a.managed).array().length;
        console.log(index, `${guild.name} - ${staticEmojis} / 50 or more emote slots`);
    }

    rl.question('Server to upload the emotes to (server index): ', answer => {
        const index = Number(answer);

        if(isNaN(index))
            throw "Input is not a number";

        if(index < 0 || index >= guilds.length)
            throw "Invalid range, please choose a valid server index";

        const guild = guilds[index];

        fs.readdir('./emotes', async (err, files) => {
            if(err)
                throw err;

            for(const file of files){
                if(path.extname(file) == '.png'){
                    const emojiName = path.basename(file, path.extname(file));

                    if(guild.emojis.cache.filter(a => a.name == emojiName).array().length > 0)
                        continue;

                    console.log('upload emoji', emojiName);

                    await guild.emojis.create(`./emotes/${file}`, emojiName);
                }
            }

            console.log(`${files.length} emotes successfully uploaded!`);
            rl.close();
            process.exit(0);
        });
    });
});

client.login(config.credentials.bot_token);
