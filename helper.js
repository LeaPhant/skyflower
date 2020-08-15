const moment = require('moment');
const distance = require('jaro-winkler');

const config = require('./config.json');

const sep = ' ✦ ';
const cmd_escape = "```";

let commands, db;

module.exports = {
    init: (_commands, _db) => {
        commands = _commands;
        db = _db;
    },

    sep: sep,

    cmd_escape: cmd_escape,

    prefix: async guild => {
        return (await db.get(`pfx_${guild.id}`)) || config.prefix;
    },

    log: (...params) => {
        console.log(`[${moment().toISOString()}]`, ...params);
    },

    error: (...params) => {
        console.error(`[${moment().toISOString()}]`, ...params);
    },

    checkCommand: (prefix, msg, command) => {
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
	            return helper.commandHelp(command.command);

	        return true;
	    }

	    return false;
	},

    formatNumber: (number, floor, rounding = 10) => {
        if(number < 1000)
            if(floor)
                return (Math.floor(number * rounding) / rounding).toFixed(Math.max(0, rounding.toString().length - 2))
            else
                return (Math.ceil(number * rounding) / rounding).toFixed(Math.max(0, rounding.toString().length - 2))
        else if(number < 10000)
            if(floor)
                return (Math.floor(number / 1000 * rounding) / rounding).toFixed(rounding.toString().length - 1) + 'K';
            else
                return (Math.ceil(number / 1000 * rounding) / rounding).toFixed(rounding.toString().length - 1) + 'K';
        else if(number < 1000000)
            if(floor)
                return (Math.floor(number / 1000 * rounding) / rounding).toFixed(rounding.toString().length - 1) + 'K';
            else
                return (Math.ceil(number / 1000 * rounding) / rounding).toFixed(rounding.toString().length - 1) + 'K';
        else if(number < 1000000000)
            if(floor)
                return (Math.floor(number / 1000 / 1000 * rounding) / rounding).toFixed(rounding.toString().length - 1) + 'M';
            else
                return (Math.ceil(number / 1000 / 1000 * rounding) / rounding).toFixed(rounding.toString().length - 1) + 'M';
        else
        if(floor)
            return (Math.floor(number / 1000 / 1000 / 1000 * rounding * 10) / (rounding * 10)).toFixed(rounding.toString().length) + 'B';
        else
            return (Math.ceil(number / 1000 / 1000 / 1000 * rounding * 10) / (rounding * 10)).toFixed(rounding.toString().length) + 'B';
    },

    getBazaarProduct: (query, products) => {
        let resultMatch;
        let itemResults = [];

        for(const key in products)
            itemResults.push({...products[key]});

        for(const product of itemResults){
            if(product.name.toLowerCase() == query)
                resultMatch = product;

            product.tagMatches = 0;

            product.distance = distance(product.name, query, { caseSensitive: false });

            for(const part of query.split(" "))
                for(const tag of product.tag)
                    if(tag == part)
                        product.tagMatches++;
        }

        itemResults = itemResults.sort((a, b) => {
            if(a.tagMatches > b.tagMatches) return -1;
            if(a.tagMatches < b.tagMatches) return 1;

            if(a.distance > b.distance) return -1;
            if(a.distance < b.distance) return 1;
        });

        if(!resultMatch)
            resultMatch = itemResults[0];

        return resultMatch;
    },

    getLeaderboard: (query, leaderboards) => {
        let resultMatch;
        let lbResults = [];

        for(const lb of leaderboards)
            lbResults.push({...lb});

        for(const lb of lbResults){
            if(lb.name.toLowerCase() == query)
                resultMatch = lb;

            lb.tagMatches = 0;

            lb.distance = distance(lb.name, query, { caseSensitive: false });

            for(const queryPart of query.toLowerCase().split(" "))
                for(const namePart of lb.name.toLowerCase().split(" "))
                    if(namePart == queryPart)
                        lb.tagMatches++;
        }

        lbResults = lbResults.sort((a, b) => {
            if(a.tagMatches > b.tagMatches) return -1;
            if(a.tagMatches < b.tagMatches) return 1;

            if(a.distance > b.distance) return -1;
            if(a.distance < b.distance) return 1;
        });

        if(!resultMatch)
            resultMatch = lbResults[0];

        return resultMatch;
    },

    commandHelp: commandName => {
        if(Array.isArray(commandName))
            commandName = commandName[0];

        for(let i = 0; i < commands.length; i++){
            let command = commands[i];

            if(!Array.isArray(command.command))
                command.command = [command.command];

            if(command.command.includes(commandName)){
                let embed = {
                    fields: []
                };

                let commandsValue = "";
                let commandsName = "Command";

                if(command.command.length > 1)
                    commandsName += "s";

                command.command.forEach((_command, index) => {
                    if(index > 0)
                        commandsValue += ", ";

                    commandsValue += `\`${config.prefix}${_command}\``;
                });

                embed.fields.push({
                    name: commandsName,
                    value: commandsValue + "\n"
                });

                if(!Array.isArray(command.description))
                    command.description = [command.description];

                if(command.description){
                    embed.fields.push({
                        name: "Description",
                        value: command.description.join("\n") + "\n"
                    })
                }

                if(command.usage){
                    embed.fields.push({
                        name: "Usage",
                        value: `${cmd_escape}${config.prefix}${command.command[0]} ${command.usage}${cmd_escape}\n`
                    });
                }

                if(command.example){
                    let examples = command.example;
                    let examplesValue = "";
                    let examplesName = "Example";

                    if(!Array.isArray(examples))
                        examples = [examples];

                    if(examples.length > 1)
                        examplesName += "s";

                    examples.forEach((example, index) => {
                        if(index > 0)
                            examplesValue += "\n\n";

                        if(typeof example === 'object'){
                            examplesValue += `${cmd_escape}${config.prefix}${example.run}${cmd_escape}`;
                            examplesValue += example.result;
                        }else{
                            examplesValue += `${cmd_escape}${config.prefix}${example}${cmd_escape}`;
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
    },

    replaceAll: (target, search, replacement) => {
        return target.split(search).join(replacement);
    },

    splitWithTail: (string, delimiter, count) => {
        let parts = string.split(delimiter);
        let tail = parts.slice(count).join(delimiter);
        let result = parts.slice(0,count);
        result.push(tail);

        return result;
    },

    getRandomArbitrary: (min, max) => {
        return Math.random() * (max - min) + min;
    },

    getRandomInt: (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    capitalizeFirstLetter: word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    },

    titleCase: string => {
       let split = string.toLowerCase().split(' ');

       for(let i = 0; i < split.length; i++)
            split[i] = split[i].charAt(0).toUpperCase() + split[i].substring(1);

        return split.join(' ');
    },

    simplifyUsername: username => {
        return username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    },

    validUsername: username => {
        return !(/[^a-zA-Z0-9\_\[\]\ \-]/g.test(username));
    },

    getUsername: (args, message, user_ign) => {
        let return_username;

        args = args.slice(1);

        args.forEach(function(arg){
            if(module.exports.validUsername(arg))
                return_username = arg;
            else if(module.exports.validUsername(arg.substr(1)) && arg.startsWith('*'))
                return_username = arg;
        });

         if(message.guild && user_ign){
             let members = message.guild.members.array();

            args.forEach(function(arg){
                let matching_members = [];

                members.forEach(member => {
                    if(module.exports.simplifyUsername(member.user.username) == module.exports.simplifyUsername(arg))
                        matching_members.push(member.id);
                });

                matching_members.forEach(member => {
                    if(member in user_ign)
                        return_username = user_ign[member];
                });
            });
         }

        args.forEach(function(arg){
           if(arg.startsWith("<@")){
                let user_id = arg.substr(2).split(">")[0].replace('!', '');

                if(user_ign && user_id in user_ign)
                    return_username = user_ign[user_id];
           }
        });

        if(!return_username){
            if(message.author.id in user_ign)
                return_username = user_ign[message.author.id];
        }

        if(config.debug)
            module.exports.log('returning data for username', return_username);

        return return_username;
    }
}
