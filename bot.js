const config = require('./config.json');
const helper = require('./helper.js');

const Discord = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const objectPath = require("object-path");
const chalk = require('chalk');
const _ = require('lodash');
const Keyv = require('keyv');

const db = new Keyv(config.dbUri, { namespace: config.dbNamespace });
const client = new Discord.Client();

client.on('error', helper.error);

async function main(){
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
					const folderRequired = _.castArray(command.folderRequired);

					for(const folder of folderRequired){
	                    if(!fs.existsSync(path.resolve(__dirname, folder)))
	                        available = false;
	                        unavailability_reason.push(`required folder ${folder} does not exist`);
	                }
	            }

	            if(command.configRequired !== undefined && command.configRequired.length > 0){					
					const configRequired = _.castArray(command.configRequired);

					for(const configPath of configRequired){
	                    if(!objectPath.has(config, configPath)){
	                        available = false;
	                        unavailability_reason.push(`required config option ${configPath} not set`);
	                    }else if(objectPath.get(config, configPath).length == 0){
	                        available = false;
	                        unavailability_reason.push(`required config option ${configPath} is empty`);
	                    }
	                }
	            }

	            if(command.emoteRequired !== undefined && command.emoteRequired.length > 0){
					const emoteRequired = _.castArray(command.emoteRequired);

					for(const emoteName of emoteRequired){
						const emote = helper.emote(emoteName, null, client);
						
	                    if(!emote){
	                        available = false;
	                        unavailability_reason.push(`required emote ${emoteName} is missing`);
	                    }
	                }
	            }

	            if(available){
	                commands.push(command);
					
					console.log(chalk.green(`${config.prefix}${command.command[0]} successfully enabled.`));
				}else{
					command.command = _.castArray(command.command);

					console.log('');
					console.log(chalk.yellow(`${config.prefix}${command.command[0]} was not enabled:`));
					unavailability_reason.forEach(reason => {
						console.log(chalk.yellow(reason));
					});
				}
	        }
		}
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

	helper.init(commands, db);

	async function onMessage(msg){
		const prefix = await helper.prefix(msg.guild);
		const extendedLayout = await helper.extendedLayout(msg);
		const argv = msg.content.split(' ');

	    argv[0] = argv[0].substr(prefix.length);

	    if(config.debug)
			helper.log(msg.author.username, ':', msg.content);
			
		if('member' in msg 
		&& msg.member.hasPermission('ADMINISTRATOR')
		&& msg.content.startsWith('!skybotprefix')){
			const newPrefix = msg.content.substring('!skybotprefix'.length).trim();

			try{
				await db.set(`pfx_${msg.guild.id}`, newPrefix);
				await msg.channel.send(`Prefix updated to \`${newPrefix}\``);

				return;
			}catch(e){
				helper.error(e);
			}
		}

		for(const command of commands){
			const commandMatch = helper.checkCommand(prefix, msg, command);

	        if(commandMatch === true){
				let last_message = await db.get(`lm_${msg.guild.id}_${msg.channel.id}`);

	            if(command.call && typeof command.call === 'function'){
	                const promise = command.call({
	                    msg,
						last_message,
	                    argv,
						client,
						prefix,
						extendedLayout,
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

	                        Promise.all([message_promise, edit_promise, replace_promise]).then(responses => {
	                            let message = responses[0];
	                            let edit_promise = responses[1];
								let replace_promise = responses[2];

	                            if(edit_promise)
	                                message.edit(edit_promise).catch(helper.error);

								if(replace_promise){
									msg.channel.send(replace_promise)
									.catch(err => {
										msg.channel.send({
											embed: {
												color: 0xf04a4a,
												author: {
													name: 'Error'
												},
												description: err
											}
										});
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
								msg.channel.send({
									embed: {
										color: 0xf04a4a,
										author: {
											name: 'Error'
										},
										description: err
									}
								});
								msg.channel.send(`Couldn't run command: \`${err}\``);
							});
	                    }
	                }).catch(err => {
	                    if(typeof err === 'object')
	                        msg.channel.send(err);
	                    else
							msg.channel.send({
								embed: {
									color: 0xf04a4a,
									author: {
										name: 'Error'
									},
									description: err
								}
							});

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
					client,
					prefix,
					extendedLayout,
					db
	            });
	        }
	    });
	}

	client.on('message', onMessage);

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
