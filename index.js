if(require('semver').lt(process.version, '12.0.0'))
        throw "skybot only runs on Node.js 12 or higher";
        
const config = require('./config.json');

if(!config.credentials.bot_token)
    throw "Please provide a Discord bot token";

const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', { token: config.credentials.bot_token });

manager.spawn();
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));