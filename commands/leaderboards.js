const config = require('../config.json');
const axios = require('axios');
const helper = require('../helper');
const _ = require('lodash');

let leaderboards;

const updateLeaderboards = async function(){
    try{
        const lbResponse = await axios(`${config.sky_api_base}/api/v2/leaderboards`);

        leaderboards = lbResponse.data;
    }catch(e){
        helper.error(e);
    }
}

updateLeaderboards();
setInterval(updateLeaderboards, 60 * 1000);

const errorHandler = (e, embed) => {
    let error = "Failed retrieving data from API.";

    if(e.response != null && e.response.data != null && 'error' in e.response.data)
        error = e.response.data.error;

    return {
        color: helper.errorColor,
        author: {
            name: 'Error'
        },
        footer: embed.footer,
        description: error
    };
};

const drawLeaderboard = async function(_embed, args, params, _self = {}){
    try{
        const lb = helper.getLeaderboard(args.join(" "), leaderboards);
        const { data } = await axios(`${config.sky_api_base}/api/v2/leaderboard/${lb.key}`, { params });
        
        const embed = _.cloneDeep(_embed);

        let self = _self;

        if(data.self)
            self = data.self;

        if(self.rank){
            embed.author = {
                icon_url: `https://crafatar.com/avatars/${self.uuid}?size=128&overlay`,
                name: self.username,
                url: `https://sky.lea.moe/stats/${self.uuid}`
            };

            embed.description = '';

            if(self.guild)
                embed.description += `Guild: **${self.guild}**\nGuild `;

            embed.description += `Rank: **#${self.rank.toLocaleString()}**\n-> **${typeof self.amount === 'number' ? self.amount.toLocaleString() : self.amount}**`
        }

        if(lb.thumbnail)
            embed.thumbnail = { url: lb.thumbnail };

        params.page = data.page;

        embed.footer.text += `${helper.sep}Page ${params.page}`;

        embed.title = `${lb.name} Leaderboards`;

        embed.fields = [];

        for(const [index, position] of data.positions.entries()){
            embed.fields.push({
                name: `#${position.rank.toLocaleString()} – ${position.username.replace(/\_/g, '\\_')}`,
                value: `[🔗](https://sky.lea.moe/stats/${position.uuid}) ${typeof position.amount === 'number' ? position.amount.toLocaleString() : position.amount}`,
                inline: true
            });

            if(index % 2 == 1)
                embed.fields.push({
                    name: "⠀",
                    value: "⠀",
                    inline: true
                });
        }

        return { embed, self };
    }catch(e){
        return { embed: errorHandler(e, _embed), _self };
    }
};

const leaderboardCollector = async function(reaction, user, embed, message, params, args, self){
    const currentRank = params.page * params.count;
    const addRank = currentRank < 1000 ? 100 : 1000;
    const removeRank = currentRank < 2000 ? 100 : 1000;

    switch(reaction._emoji.name){
        case '⏪':
            params.page = Math.max(1, params.page - Math.floor(removeRank / params.count));
            break;
        case '⬅️':
            params.page = Math.max(1, params.page - 1);
            break;
        case '➡️':
            params.page++;
            break;
        case '⏩':
            params.page += Math.floor(addRank / params.count);
    }

    if('find' in params)
        delete params.find;
    
    try{
        const lbObj = await drawLeaderboard(embed, args, params, self);
        self = lbObj.self;

        message.edit({ embed: lbObj.embed });
    }catch(e){
        helper.error(e);
    }
};

const drawTopPositions = function(_embed, topPositions){
    const { self } = topPositions;

    let embed = _.cloneDeep(_embed);

    embed = { ...embed,
        title: "Top leaderboard ranks",
        description: `Top 1000 ranks: **${topPositions.positions.filter(a => a.rank <= 1000).length}**`,
        author: {
            icon_url: `https://crafatar.com/avatars/${self.uuid}?size=128&overlay`,
            name: self.username,
            url: `https://sky.lea.moe/stats/${self.uuid}`
        },
        fields: []
    };

    embed.footer.text += `${helper.sep}Page ${topPositions.page} / ${Math.floor(topPositions.positions.length / topPositions.count) + 1}`;

    const startPosition = (topPositions.page - 1) * topPositions.count;

    const positions = topPositions.positions
    .slice(startPosition, startPosition + topPositions.count);

    for(const [index, position] of positions.entries()){
        embed.fields.push({
            name: `#${position.rank.toLocaleString()} in ${position.leaderboard.name}`,
            value: typeof position.amount === 'number' ? position.amount.toLocaleString() : position.amount,
            inline: true
        });

        if(index % 2 == 1)
            embed.fields.push({
                name: "⠀",
                value: "⠀",
                inline: true
            });
    }

    return embed;
};

const topPositionsCollector = function(reaction, user, embed, message, topPositions){
    switch(reaction._emoji.name){
        case '⬅️':
            topPositions.page = Math.max(1, topPositions.page - 1);
            break;
        case '➡️':
            topPositions.page = Math.min(topPositions.page + 1, Math.floor(topPositions.positions.length / topPositions.count) + 1);
            break;
    }
    
    try{
        message.edit({ embed: drawTopPositions(embed, topPositions) });
    }catch(e){
        helper.error(e);
    }
};

module.exports = {
    command: ['leaderboards', 'leaderboard', 'lb'],
    description: [
        "Check leaderboards.",
    ],
    argsRequired: 1,
    usage: '[leaderboard name] [u:username] [r:rank] [g:username]',
    example: [
        {
            run: "lb sand collection",
            result: `Top 10 for Sand Collection.`
        },
        {
            run: "lb u:leaphant",
            result: `Top leaderboard positions for LeaPhant.`
        },
        {
            run: "lb deaths u:py5",
            result: `Rank for mat's deaths.`
        },
        {
            run: "lb hydra kills r:1000",
            result: `Rank 1000 for Hydra kills.`
        },
        {
            run: "lb fishing xp g:leaphant",
            result: `Rank for Fishing XP within guild LeaPhant is in.`
        }
    ],
    call: async obj => {
        const { argv, msg, prefix, extendedLayout, endEmitter, responseMsg, guildId } = obj;

        const args = [];
        const params = { count: extendedLayout ? 10 : 4, page: 1 };

        const embed = {
            color: helper.mainColor,
            fields: [],
            footer: {
                icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
                text: `sky.lea.moe${helper.sep}${prefix}lb [leaderboard] [u:user] [r:rank] [g:user]`
            },
        };

        for(const arg of argv.slice(1)){
            if(arg.toLowerCase().startsWith('u:')){
                params['find'] = arg.substring(2);
            }else if(arg.toLowerCase().startsWith('g:')){
                params['guild'] = arg.substring(2);
            }else if(arg.toLowerCase().startsWith('r:')){
                const rank = Number(arg.substring(2));

                if(isNaN(rank))
                    throw "Passed rank is not a valid number";

                params['page'] = Math.floor(rank / params.count);
                params['rank'] = rank;
            }else{
                args.push(arg);
            }
        }

        if(args.length == 0 && params.find == null)
            throw "Please specify either a leaderboard or a user.";

        const msgObj = {};
        const reactions = [];

        let topPositions, self;
        
        if(args.length == 0){
            try{
                const response = await axios.get(`${config.sky_api_base}/api/v2/leaderboards/${params.find}`);

                topPositions = { ...response.data, page: 1, count: params.count };

                msgObj.embed = drawTopPositions(embed, topPositions);
                reactions.push('⬅️', '➡️');
            }catch(e){
                msgObj.embed = errorHandler(e, embed);
            }            
        }else{
            const lbObj = await drawLeaderboard(embed, args, params);

            msgObj.embed = lbObj.embed;
            self = lbObj.self;

            reactions.push('⏪', '⬅️', '➡️', '⏩');
        }

        let message = responseMsg;

        if(responseMsg)
            await responseMsg.edit(msgObj);
        else
            message = await msg.channel.send(msgObj);

        if(reactions.length == 0)
            return message;

        reactions.map(a => message.react(a).catch(() => {}));

        const collector = message.createReactionCollector(
            (reaction, user) => user.bot === false && user.id == msg.author.id,
            { idle: 120 * 1000 }
        );

        collector.on('collect', async (reaction, user) => {
            reaction.users.remove(user.id).catch(() => {});
        });

        if(args.length == 0)
            collector.on('collect', (...reactionArgs) => { 
                topPositionsCollector(...reactionArgs, embed, message, topPositions) 
            });
        else
            collector.on('collect', (...reactionArgs) => { 
                leaderboardCollector(...reactionArgs, embed, message, params, args, self) 
            });

        collector.on('end', () => {
            message.reactions.removeAll();
        });

        endEmitter.once(`end-${guildId}_${message.channel.id}_${message.id}`, () => {
            collector.stop();
        });

        return message;
    }
}