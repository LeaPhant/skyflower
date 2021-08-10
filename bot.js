const config = require('./config.json');
const helper = require('./helper.js');

const Discord = require('discord.js');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const objectPath = require('object-path');
const chalk = require('chalk');
const _ = require('lodash');
const Keyv = require('keyv');

const endEmitter = new EventEmitter();

const db = new Keyv(config.dbUri, { namespace: config.dbNamespace });
const client = new Discord.Client();

client.on('error', helper.error);
client.on('ready', () => {
	client.user.setActivity(`${config.prefix}help`, { type: 'PLAYING', shardID: client.shard.ids })
});

const commands = [];
const commandsPath = path.resolve(__dirname, 'commands');

const handlers = [];
const handlersPath = path.resolve(__dirname, 'handlers');

async function reloadCommands(){
	while(commands.length)
		commands.pop();

	while(handlers.length)
		handlers.pop();

	for(const key of Object.keys(require.cache))
		if(key.includes('/commands/') || key.includes('/handlers/'))
			delete require.cache[key];

	try{
		const items = await fs.readdir(commandsPath);

		for(const item of items){
			if(path.extname(item) == '.js'){
				const command = require(path.resolve(commandsPath, item));

				command.filename = path.resolve(commandsPath, item);

				let available = true;
				const unavailabilityReason = [];

				if(command.folderRequired !== undefined && command.folderRequired.length > 0){
					const folderRequired = _.castArray(command.folderRequired);

					for(const folder of folderRequired){
						if(!fs.existsSync(path.resolve(__dirname, folder)))
							available = false;
							unavailabilityReason.push(`required folder ${folder} does not exist`);
					}
				}

				if(command.configRequired !== undefined && command.configRequired.length > 0){					
					const configRequired = _.castArray(command.configRequired);

					for(const configPath of configRequired){
						if(!objectPath.has(config, configPath)){
							available = false;
							unavailabilityReason.push(`required config option ${configPath} not set`);
						}else if(objectPath.get(config, configPath).length == 0){
							available = false;
							unavailabilityReason.push(`required config option ${configPath} is empty`);
						}
					}
				}

				if(command.emoteRequired !== undefined && command.emoteRequired.length > 0){
					const emoteRequired = _.castArray(command.emoteRequired);

					for(const emoteName of emoteRequired){
						const emote = helper.emote(emoteName, null, client);
						
						if(!emote){
							available = false;
							unavailabilityReason.push(`required emote ${emoteName} is missing`);
						}
					}
				}

				if(available){
					commands.push(command);
					
					if(config.debug)
						console.log(chalk.green(`${config.prefix}${command.command[0]} successfully enabled.`));
				}else{
					command.command = _.castArray(command.command);

					console.log('');
					console.log(chalk.yellow(`${config.prefix}${command.command[0]} was not enabled:`));

					for(const reason of unavailabilityReason)
						console.log(chalk.yellow(reason));
				}
			}
		}
	}catch(e){
		console.error("Unable to read commands folder");
		throw e;
	}

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

	helper.init(commands, db);
}

async function onMessage(msg, isEdit = false){
	if(msg.author.bot)
		return;

	const prefix = await helper.prefix(msg.guild);
	const extendedLayout = await helper.extendedLayout(msg);
	const argv = msg.content.split(' ');

	const guildId = msg.guild != null ? msg.guild.id : 'me';

	argv[0] = argv[0].substr(prefix.length);

	if(config.debug)
		helper.log(isEdit ? '(edit)' : '', msg.author.username, ':', msg.content);

	let responseMsg;

	if(isEdit){
		const responseMsgId = await db.get(`response_${guildId}_${msg.channel.id}_${msg.id}`);

		if(responseMsgId == null)
			return;

		const split = responseMsgId.split("_");
		responseMsg = msg.channel.messages.cache.get(split[2]);

		if(responseMsg == null)
			return;
	}

	if(msg.member != null
	&& msg.member.hasPermission('ADMINISTRATOR')
	&& msg.content.startsWith('s!skyflowerprefix')){
		const newPrefix = msg.content.substring('s!skyflowerprefix'.length).trim();

		try{
			await db.set(`pfx_${msg.guild.id}`, newPrefix);
			await msg.channel.send(`Prefix updated to \`${newPrefix}\``);

			return;
		}catch(e){
			helper.error(e);
		}
	}

	if(_.castArray(config.owners).includes(msg.author.id)
	&& msg.content.startsWith('s!reloadcommands'))
		client.shard.send('reloadCommands').catch(() => {});

	for(const handler of handlers){
		if(handler.message && typeof handler.message === 'function'){
			handler.message({
				msg,
				argv,
				client,
				prefix,
				extendedLayout,
				db
			}).catch(helper.error);
		}
	}

	for(const command of commands){
		const commandMatch = await helper.checkCommand(prefix, msg, command);

		if(commandMatch === true && typeof command.call === 'function'){
			if(isEdit)
				endEmitter.emit(`end-${guildId}_${responseMsg.channel.id}_${responseMsg.id}`);

			let response, messagePromise;

			try{
				response = await command.call({
					guildId,
					msg,
					argv,
					client,
					prefix,
					extendedLayout,
					responseMsg,
					endEmitter,
					db
				});
			}catch(e){
				helper.error(e);

				if(typeof e === 'object' && e.embed != null)
					response = e;
				else
					response = {
						embed: {
							color: helper.errorColor,
							author: {
								name: 'Error'
							},
							description: e.toString()
						}
					};
			}

			if(response instanceof Discord.Message){
				await db.set(
					`response_${guildId}_${msg.channel.id}_${msg.id}`, 
					`${guildId}_${response.channel.id}_${response.id}`,
					2 * 60 * 1000);

				return;
			}

			if(typeof response === 'string')
				response = { embed: { color: helper.mainColor, description: response }};

			if(isEdit)
				messagePromise = responseMsg.edit(response);
			else
				messagePromise = msg.channel.send(response);

			messagePromise.then(async message => {
				await db.set(
					`response_${guildId}_${msg.channel.id}_${msg.id}`, 
					`${guildId}_${message.channel.id}_${message.id}`,
					2 * 60 * 1000);
			});

			try{
				await messagePromise;
			}catch(e){
				message = await msg.channel.send({
					embed: {
						color: helper.errorColor,
						author: {
							name: 'Error'
						},
						description: err
					}
				});
			}
		}else if(commandMatch !== false){
			let msgObj;

			if(typeof commandMatch == 'string')
				msgObj = { embed: { color: helper.mainColor, description: commandMatch } };
			else
				msgObj = commandMatch;

			const message = await msg.channel.send(msgObj);
			
			await db.set(
				`response_${guildId}_${msg.channel.id}_${msg.id}`, 
				`${guildId}_${message.channel.id}_${message.id}`,
				2 * 60 * 1000);
		}
	}
}

async function main(){
	await reloadCommands();

	client.on('message', onMessage);
	client.on('messageUpdate', (oldMsg, newMsg) => { onMessage(newMsg, true) });
	client.on('messageDelete', async msg => {
		const guildId = msg.guild != null ? msg.guild.id : 'me';

	    if(config.debug)
			helper.log('(delete)', msg.author.username, ':', msg.content);

		const responseMsgId = await db.get(`response_${guildId}_${msg.channel.id}_${msg.id}`);

		if(responseMsgId == null)
			return;

		const split = responseMsgId.split("_");
		const responseMsg = msg.channel.messages.cache.get(split[2]);

		if(responseMsg == null)
			return;

		endEmitter.emit(`end-${guildId}_${responseMsg.channel.id}_${responseMsg.id}`);
		responseMsg.delete().catch(console.error);
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

	process.on('message', message => {
		if(message === 'reloadCommands')
			reloadCommands();
	});
}

main();
