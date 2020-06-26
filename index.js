async function main(){
	if(require('semver').lt(process.version, '12.0.0'))
		throw "skybot only runs on Node.js 12 or higher";

	const Discord = require('discord.js');
	const fs = require('fs-extra');
	const path = require('path');
	const objectPath = require("object-path");
	const chalk = require('chalk');

	const helper = require('./helper.js');

	const dbUrl = 'mongodb://localhost:27017';
    const dbName = 'sbstats';

    const { MongoClient } = require('mongodb');
    const mongo = new MongoClient(dbUrl, { useUnifiedTopology: true });
    await mongo.connect();

    const db = mongo.db(dbName);

	const client = new Discord.Client({autoReconnect:true});

	client.on('error', helper.error);

	const config = require('./config.json');

	function checkCommand(msg, command){
	    if(!msg.content.startsWith(config.prefix))
	        return false;

		if(msg.author.bot)
			return false;

	    const argv = msg.content.split(' ');
		const msgCheck = msg.content.toLowerCase().substr(config.prefix.length).trim();

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
	}

	const commands = [];
	const commandsPath = path.resolve(__dirname, 'commands');

	try{
		const items = await fs.readdir(commandsPath);

		for(const item of items){
			if(path.extname(item) == '.js'){
	            const command = require(path.resolve(commandsPath, item));

	            command.filename = path.resolve(commandsPath, item);

	            let available = true;
	            let unavailability_reason = [];

	            if(command.folderRequired !== undefined && command.folderRequired.length > 0){
	                let { folderRequired } = command;

	                if(!Array.isArray(command.folderRequired))
	                    folderRequired = [folderRequired];

	                folderRequired.forEach(folder => {
	                    if(!fs.existsSync(path.resolve(__dirname, folder)))
	                        available = false;
	                        unavailability_reason.push(`required folder ${folder} does not exist`);
	                });
	            }

	            if(command.configRequired !== undefined && command.configRequired.length > 0){
	                let { configRequired } = command;

	                if(!Array.isArray(command.configRequired))
	                    configRequired = [configRequired];

	                configRequired.forEach(configPath => {
	                    if(!objectPath.has(config, configPath)){
	                        available = false;
	                        unavailability_reason.push(`required config option ${configPath} not set`);
	                    }else if(objectPath.get(config, configPath).length == 0){
	                        available = false;
	                        unavailability_reason.push(`required config option ${configPath} is empty`);
	                    }
	                });
	            }

	            if(command.emoteRequired !== undefined && command.emoteRequired.length > 0){
	                let { emoteRequired } = command;

	                if(!Array.isArray(command.emoteRequired))
	                    emoteRequired = [emoteRequired];

	                emoteRequired.forEach(emote_name => {
	                    let emote = helper.emote(emote_name, null, client);
	                    if(!emote){
	                        available = false;
	                        unavailability_reason.push(`required emote ${emote_name} is missing`);
	                    }
	                });
	            }

	            if(available){
	                commands.push(command);

					console.log(chalk.green(`${config.prefix}${command.command[0]} successfully enabled.`));
				}else{
					if(!Array.isArray(command.command))
						command.command = [command.command];

					console.log('');
					console.log(chalk.yellow(`${config.prefix}${command.command[0]} was not enabled:`));
					unavailability_reason.forEach(reason => {
						console.log(chalk.yellow(reason));
					});
				}
	        }
		}

		helper.init(commands);
	}catch(e){
		console.error("Unable to read commands folder");
		throw e;
	}

	const handlers = [];
	const handlersPath = path.resolve(__dirname, 'handlers');

	try{
		const items = await fs.readdir(handlersPath);

		for(const item of items){
			if(path.extname(item) == '.js'){
	            const handler = require(path.resolve(handlersPath, item));
	            handlers.push(handler);
	        }
		}
	}catch(e){
		console.error("Unable to read handlers folder");
		throw e;
	}

	async function onMessage(msg){
	    const argv = msg.content.split(' ');

	    argv[0] = argv[0].substr(config.prefix.length);

	    if(config.debug)
	        helper.log(msg.author.username, ':', msg.content);

		for(const command of commands){
			const commandMatch = checkCommand(msg, command);

	        if(commandMatch === true){
				console.log(command.command[0]);

	            if(command.call && typeof command.call === 'function'){
	                const promise = command.call({
	                    msg,
	                    argv,
	                    client,
						db
	                });

	                Promise.resolve(promise).then(response => {
	                    if(response){
	                        let message_promise, edit_promise, replace_promise, remove_path, content;

	                        if(typeof response === 'object' && 'edit_promise' in response){
	                            ({edit_promise} = response);
	                            delete response.edit_promise;
	                        }

							if(typeof response === 'object' && 'replace_promise' in response){
	                            ({replace_promise} = response);
	                            delete response.replace_promise;
	                        }

	                        if(typeof response === 'object' && 'remove_path' in response){
								({remove_path} = response);
	                            delete response.remove_path;
	                        }

							if(typeof response === 'object' && 'content' in response){
								({content} = response);
	                            delete response.content;
							}

							if(content)
		                        message_promise = msg.channel.send(content, response);
							else
								message_promise = msg.channel.send(response);

							message_promise.catch(err => {
								msg.channel.send(`Couldn't run command: \`${err}\``);
							});


	                        Promise.all([message_promise, edit_promise, replace_promise]).then(responses => {
	                            let message = responses[0];
	                            let edit_promise = responses[1];
								let replace_promise = responses[2];

	                            if(edit_promise)
	                                message.edit(edit_promise).catch(helper.error);

								if(replace_promise){
									msg.channel.send(replace_promise)
									.catch(err => {
										msg.channel.send(`Couldn't run command: \`${err}\``);
									}).finally(() => {
										message.delete();

										if(typeof replace_promise === 'object' && 'remove_path' in replace_promise){
											({remove_path} = replace_promise);
				                            delete replace_promise.remove_path;
				                        }

										if(remove_path)
											fs.remove(remove_path, err => { if(err) helper.error });
									});
								}

	                            if(remove_path)
	                                fs.remove(remove_path, err => { if(err) helper.error });
	                        }).catch(err => {
								msg.channel.send(`Couldn't run command: \`${err}\``);
							});
	                    }
	                }).catch(err => {
	                    if(typeof err === 'object')
	                        msg.channel.send(err);
	                    else
	                        msg.channel.send(`Couldn't run command: \`${err}\``);

	                    helper.error(err);
	                });
	            }
	        }else if(commandMatch !== false){
	            msg.channel.send(commandMatch);
	        }
		}

	    handlers.forEach(handler => {
	        if(handler.message && typeof handler.message === 'function'){
	            handler.message({
	                msg,
	                argv,
	                client
	            });
	        }
	    });
	}

	client.on('message', onMessage);

	client.on('ready', () => {
		helper.log('skybot is ready');

		if(config.credentials.discord_client_id)
			helper.log(
				`Invite bot to server: ${chalk.blueBright('https://discordapp.com/api/oauth2/authorize?client_id='
				+ config.credentials.discord_client_id + '&permissions=8&scope=bot')}`);
	});

	try{
		await client.login(config.credentials.bot_token);
	}catch(e){
		console.error('');
		console.error(chalk.redBright("Couldn't log into Discord. Wrong bot token?"));
		console.error('');
		console.error(err);
		process.exit();
	}
}

main();
