const config = require('../config.json');
const axios = require('axios');
const helper = require('../helper');

let leaderboards;

const updateLeaderboards = async function(){
    try{
        const lbResponse = await axios(`${config.sky_api_base}/api/v2/leaderboards`);

        leaderboards = lbResponse.data;
    }catch(e){
        console.error(e);
    }
}

updateLeaderboards();
setInterval(updateLeaderboards, 60 * 1000);

const drawLeaderboard = async function(embed, args, params){
    try{
        const lb = helper.getLeaderboard(args.join(" "), leaderboards);

        const { data } = await axios(`${config.sky_api_base}/api/v2/leaderboard/${lb.key}`, { params });

        if(data.self){
            const { self } = data;

            embed.author = {
                icon_url: `https://crafatar.com/avatars/${self.uuid}?size=128&overlay`,
                name: self.username,
                url: `https://sky.lea.moe/stats/${self.uuid}`
            };

            embed.description = `Rank: **#${self.rank}**\n-> **${typeof self.amount === 'number' ? self.amount.toLocaleString() : self.amount}**`
        }

        params.page = data.page;

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

        return embed;
    }catch(e){
        console.error(e);
        
        let error = "Failed retrieving data from API.";

        if(e.response != null && e.response.data != null && 'error' in e.response.data)
            error = e.response.data.error;

        return {
            color: 0xf04a4a,
            author: {
                name: 'Error'
            },
            footer: embed.footer,
            description: error
        }
    }
}

module.exports = {
    command: ['leaderboards', 'leaderboard', 'lb'],
    argsRequired: 1,
    description: [
        "Check leaderboards.",
    ],
    usage: '<leaderboard name> [u:username] [r:rank]',
    example: [
        {
            run: "lb sand collection",
            result: `Returns Top 10 for Sand Collection.`
        },
        {
            run: "lb deaths u:py5",
            result: `Returns rank for mat's deaths.`
        },
        {
            run: "lb hydra kills r:1000",
            result: `Returns ranks 990 to 1000 for Hydra kills.`
        }
    ],
    call: async obj => {
        const { argv, msg } = obj;

        const args = [];
        const params = { count: 10, page: 1 };

        const embed = {
            color: 11809405,
            fields: [],
            footer: {
                icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
                text: `sky.lea.moe – ${config.prefix}lb <leaderboard> [u:user] [r:rank]`
            },
        };

        for(let arg of argv.slice(1)){
            arg = arg.toLowerCase();

            if(arg.startsWith('u:')){
                params['find'] = arg.substring(2);
            }else if(arg.startsWith('r:')){
                const rank = Number(arg.substring(2));

                if(isNaN(rank))
                    throw "Passed rank is not a valid number";

                params['page'] = Math.floor(rank / 10);
                params['rank'] = rank;
            }else{
                args.push(arg);
            }
        }

        const message = await msg.channel.send({ embed: await drawLeaderboard(embed, args, params) });

        ['⬅️', '➡️'].map(a => message.react(a));

        const collector = message.createReactionCollector(
            (reaction, user) => user.bot === false,
            { idle: 120 * 1000 }
        );

        collector.on('collect', async (reaction, user) => {
            reaction.users.remove(user.id).catch(console.error);

            if(user.id != msg.author.id)
                return;

            if(reaction._emoji.name == '⬅️')
                params.page = Math.max(1, params.page - 1);

            if(reaction._emoji.name == '➡️')
                params.page++;

            if('find' in params)
                delete params.find;
            
            try{
                message.edit({ embed: await drawLeaderboard(embed, args, params) });
            }catch(e){
                console.error(e);
            }
        });

        collector.on('end', () => {
            message.reactions.removeAll();
        });
    }
}