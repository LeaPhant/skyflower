import * as _ from 'lodash';
import distance from 'jaro-winkler';

import config from './config.json';
import emotes from './emotes.json';

const sep = ' ✦ ';
const cmd_escape = "```";
const backtick = "`";

let commands, db;

export default {
    init: (_commands, _db) => {
        commands = _commands;
        db = _db;
    },

    sep: sep,

    cmd_escape: cmd_escape,

    mainColor: 0xdf73af,
    errorColor: 0xf04a4a,

    extendedLayout: async interaction => {
        if(interaction.guildId == null)
            return true;

        const layout = await db.get(`layout_${interaction.guildId}_${interaction.channelId}`) || 'basic';

        return layout == 'extended';
    },

    prefix: async guild => {
        if(guild == null)
            return config.prefix;

        return (await db.get(`pfx_${guild.id}`)) || config.prefix;
    },

    log: (...params) => {
        console.log(`[${new Date().toISOString()}]`, ...params);
    },

    error: (...params) => {
        console.error(`[${new Date().toISOString()}]`, ...params);
    },

    getBazaarProduct: (query, products) => {
        let resultMatch;
        let itemResults = [];

        for(const key in products)
            itemResults.push({...products[key]});

        for(const product of itemResults){
            if(product.name.toLowerCase() == query)
                return product;

            product.tagMatches = 0;

            for(const part of query.split(" "))
                for(const tag of product.tag)
                    if(tag == part)
                        product.tagMatches++;
        }

        itemResults = itemResults.sort((a, b) => b.tagMatches - a.tagMatches);
        itemResults = itemResults.filter(a => a.tagMatches == itemResults[0].tagMatches);

        if(itemResults.length == 1)
            return itemResults[0];

        itemResults.forEach(a => a.distance = distance(a.name, query, { caseSensitive: false }));
        itemResults = itemResults.sort((a, b) => b.distance - a.distance);

        return itemResults[0];
    },

    getLeaderboard: (query, leaderboards) => {
        let resultMatch;
        let lbResults = [];

        for(const lb of leaderboards)
            lbResults.push({...lb});

        for(const lb of lbResults){
            if(lb.name.toLowerCase() == query)
                return lb;

            lb.tagMatches = 0;

            for(const queryPart of query.toLowerCase().split(" "))
                for(const namePart of lb.name.toLowerCase().split(" "))
                    if(namePart == queryPart)
                        lb.tagMatches++;
        }

        lbResults = lbResults.sort((a, b) => b.tagMatches - a.tagMatches);
        lbResults = lbResults.filter(a => a.tagMatches == lbResults[0].tagMatches);

        if(lbResults.length == 1)
            return lbResults[0];

        lbResults.forEach(a => a.distance = distance(a.name, query, { caseSensitive: false }));
        lbResults = lbResults.sort((a, b) => b.distance - a.distance);

        resultMatch = lbResults[0];

        return lbResults[0];
    },

    commandHelp: async (commandName, prefix) => {
        if(Array.isArray(commandName))
            commandName = commandName[0];

        for(let i = 0; i < commands.length; i++){
            let command = commands[i];

            command.command = _.castArray(command.command);

            if(command.command.includes(commandName)){
                let embed = {
                    fields: []
                };

                let commandsValue = "";
                const commandsName = "Aliases";

                command.command.forEach((_command, index) => {
                    if(index > 0)
                        commandsValue += ", ";

                    commandsValue += `\`${prefix}${_command}\``;
                });

                embed.fields.push({
                    name: commandsName,
                    value: commandsValue + "\n"
                });

                command.description = _.castArray(command.description);

                if(command.description){
                    embed.fields.push({
                        name: "Description",
                        value: command.description.join("\n") + "\n"
                    })
                }

                if(command.usage){
                    embed.fields.push({
                        name: "Usage",
                        value: `${backtick}${prefix}${command.command[0]} ${command.usage}${backtick}\n`
                    });
                }

                if(command.example){
                    let examples = _.castArray(command.example);
                    let examplesValue = "";
                    let examplesName = "Example";

                    if(examples.length > 1)
                        examplesName += "s";

                    examples.forEach((example, index) => {
                        if(index > 0)
                            examplesValue += "\n";

                        if(example.result != null){
                            examplesValue += `${backtick}${prefix}${example.run}${backtick}: `;
                            examplesValue += example.result;
                        }else{
                            examplesValue += `${backtick}${prefix}${example}${backtick}`;
                        }
                    });

                    embed.fields.push({
                        name: examplesName,
                        value: examplesValue + "\n"
                    })
                }

                return { embed: embed };
            }
        }

        return "Couldn't find command.";
    },

    emote: (emoteName, guild, client) => {
        if(emoteName in emotes)
            return client.emojis.cache.get(emotes[emoteName].id);

        let emote;

        if(guild)
            emote = guild.emojis.cache.find(emoji => emoji.name.toLowerCase() === emoteName.toLowerCase());

        if(!emote)
            emote = client.emojis.cache.find(emoji => emoji.name.toLowerCase() === emoteName.toLowerCase());

        return emote;
    }
};
