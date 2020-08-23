const moment = require('moment');
const _ = require('lodash');
const distance = require('jaro-winkler');

const config = require('./config.json');

const sep = ' ✦ ';
const cmd_escape = "```";
const backtick = "`";

let commands, db;

module.exports = {
    init: (_commands, _db) => {
        commands = _commands;
        db = _db;
    },

    sep: sep,

    cmd_escape: cmd_escape,

    extendedLayout: async msg => {
        if(msg.guild == null)
            return true;

        const layout = await db.get(`layout_${msg.guild.id}_${msg.channel.id}`) || 'basic';

        return layout == 'extended';
    },

    prefix: async guild => {
        if(guild == null)
            return config.prefix;

        return (await db.get(`pfx_${guild.id}`)) || config.prefix;
    },

    log: (...params) => {
        console.log(`[${moment().toISOString()}]`, ...params);
    },

    error: (...params) => {
        console.error(`[${moment().toISOString()}]`, ...params);
    },

    checkCommand: async (prefix, msg, command) => {
	    if(!msg.content.startsWith(prefix))
	        return false;

		if(msg.author.bot)
			return false;

	    const argv = msg.content.split(' ');
		const msgCheck = msg.content.toLowerCase().substr(prefix.length).trim();

	    let commandMatch = false;
	    let commands = command.command;
	    let startswith = false;

	    if(command.startsWith)
	        startswith = true;

	    if(!Array.isArray(commands))
	        commands = [commands];

	    for(let i = 0; i < commands.length; i++){
	        let commandPart = commands[i].toLowerCase().trim();
	        if(startswith){
	            if(msgCheck.startsWith(commandPart))
	                commandMatch = true;
	        }else{
	            if(msgCheck.startsWith(commandPart + ' ')
	            || msgCheck == commandPart)
	                commandMatch = true;
	        }
	    }

	    if(commandMatch){
	        let hasPermission = true;

	        if(command.permsRequired)
	            hasPermission = command.permsRequired.length == 0 || command.permsRequired.some(perm => msg.member.hasPermission(perm));

	        if(!hasPermission)
	            return 'Insufficient permissions for running this command.';

	        if(command.argsRequired !== undefined && argv.length <= command.argsRequired)
                return await module.exports.commandHelp(command.command, msg);

	        return true;
	    }

	    return false;
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

    commandHelp: async (commandName, msg) => {
        if('guild' in msg){
            const extendedLayout = await module.exports.extendedLayout(msg);
            const commandsChannel = await db.get(`commands_${msg.guild.id}`);

            if(!extendedLayout)
                if(commandsChannel)
                    return `Run command in <#${commandsChannel}> for usage info.`;
                else
                    return `Run command in commands channel for usage info.`;
        }  

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

                    commandsValue += `\`${config.prefix}${_command}\``;
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
                        value: `${backtick}${config.prefix}${command.command[0]} ${command.usage}${backtick}\n`
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
                            examplesValue += `${backtick}${config.prefix}${example.run}${backtick}: `;
                            examplesValue += example.result;
                        }else{
                            examplesValue += `${backtick}${config.prefix}${example}${backtick}`;
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
        let emote;

        if(guild)
            emote = guild.emojis.cache.find(emoji => emoji.name.toLowerCase() === emoteName.toLowerCase());

        if(!emote)
            emote = client.emojis.cache.find(emoji => emoji.name.toLowerCase() === emoteName.toLowerCase());

        return emote;
    }
}
