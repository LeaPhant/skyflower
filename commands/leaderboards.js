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

const drawLeaderboard = async function(args, params){
    const embed = {
        color: 11809405,
        fields: [],
        footer: {
            icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
            text: `sky.lea.moe – ${config.prefix}lb <leaderboard> [u:user]`
        },
    };

    console.log(args);

    const lb = helper.getLeaderboard(args.join(" "), leaderboards);

    const { data } = await axios(`${config.sky_api_base}/api/v2/leaderboard/${lb.key}`, { params });

    params.page = data.page;

    embed.title = `${lb.name} Leaderboards`;

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
}

module.exports = {
    command: ['leaderboards', 'leaderboard', 'lb'],
    argsRequired: 1,
    description: [
        "Check leaderboards.",
    ],
    usage: '<leaderboard name> [u:username]',
    example: [
        {
            run: "lb sand collection",
            result: `Returns Top 10 for Sand Collection.`
        },
        {
            run: "lb deaths u:py5",
            result: `Returns rank for mat's deaths`
        }
    ],
    call: async obj => {
        const { argv, msg } = obj;

        const args = [];
        const params = { count: 10, page: 1 };

        for(let arg of argv.slice(1)){
            arg = arg.toLowerCase();

            if(arg.startsWith('u:'))
                params['find'] = arg.substring(2);
            else
                args.push(arg);
        }

        const message = await msg.channel.send({ embed: await drawLeaderboard(args, params) });

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
                message.edit({ embed: await drawLeaderboard(args, params) });
            }catch(e){
                console.error(e);
            }
        });

        collector.on('end', () => {
            message.reactions.removeAll();
        });
    }
}