import Command from '../command.js';

import config from '../config.json' assert { type: 'json' };
import helper from '../helper.js';
import fetch from 'node-fetch';
import { cloneDeep, upperFirst } from 'lodash-es';
import { InteractionCollector, MessageActionRow } from 'discord.js';

let leaderboards;

const updateLeaderboards = async function () {
    try {
        const lbResponse = await fetch(`${config.sky_api_base}/api/v2/leaderboards`);

        leaderboards = await lbResponse.json();
    } catch (e) {
        helper.error(e);
    }
}

updateLeaderboards();
setInterval(updateLeaderboards, 60 * 1000);

const errorHandler = (e, embed) => {
    let error = "Failed retrieving data from API.";

    if (e.response != null && e.response.data != null && 'error' in e.response.data)
        error = e.response.data.error;

    return {
        color: helper.errorColor,
        author: {
            name: 'Error'
        },
        description: error
    };
};

const drawLeaderboard = async function (_embed, leaderboard, params, _self = {}) {
    try {
        const lb = helper.getLeaderboard(leaderboard, leaderboards);
        const response = await helper.apiRequest(`/api/v2/leaderboard/${encodeURIComponent(lb.key)}`, params);

        const data = await response.json();

        const embed = cloneDeep(_embed);

        let self = _self;

        if (data.self)
            self = data.self;

        if (self.rank) {
            embed.author = {
                icon_url: `https://crafatar.com/avatars/${self.uuid}?size=128&overlay`,
                name: self.username,
                url: `https://sky.lea.moe/stats/${self.uuid}`
            };

            embed.description = '';

            if (self.guild)
                embed.description += `Guild: **${self.guild}**\nGuild `;

            embed.description += `Rank: **#${self.rank.toLocaleString()}**\n-> **${typeof self.amount === 'number' ? self.amount.toLocaleString() : self.amount}**`
        }

        if (lb.thumbnail)
            embed.thumbnail = { url: lb.thumbnail };

        params.page = data.page;

        embed.footer = { text: `Page ${params.page}` };
        embed.title = `${lb.name} Leaderboards`;

        if (params['mode'])
            embed.title += ` – ${upperFirst(params['mode'])}`;

        embed.fields = [];

        if (data.positions == null)
            return { embed, self };

        for (const [index, position] of data.positions.entries()) {
            embed.fields.push({
                name: `#${position.rank.toLocaleString()} – ${position.username.replace(/\_/g, '\\_')}`,
                value: `[🔗](https://sky.lea.moe/stats/${position.uuid}) ${typeof position.amount === 'number' ? position.amount.toLocaleString() : position.amount}`,
                inline: true
            });

            if (index % 2 == 1)
                embed.fields.push({
                    name: "⠀",
                    value: "⠀",
                    inline: true
                });
        }

        return { embed, self };
    } catch (e) {
        helper.error(e);
        return { embed: errorHandler(e, _embed), _self };
    }
};

const leaderboardCollector = async function (i, embed, row, params, leaderboard, self) {
    const currentRank = params.page * params.count;
    const addRank = currentRank < 1000 ? 100 : 1000;
    const removeRank = currentRank < 2000 ? 100 : 1000;

    switch (i.customId) {
        case 'more-left':
            params.page = Math.max(1, params.page - Math.floor(removeRank / params.count));
            break;
        case 'left':
            params.page = Math.max(1, params.page - 1);
            break;
        case 'right':
            params.page++;
            break;
        case 'more-right':
            params.page += Math.floor(addRank / params.count);
    }

    if ('find' in params)
        delete params.find;

    try {
        const lbObj = await drawLeaderboard(embed, leaderboard, params, self);
        self = lbObj.self;

        await i.update({ embeds: [lbObj.embed], components: [row] });
    } catch (e) {
        helper.error(e);
    }
};

const drawTopPositions = function (_embed, topPositions) {
    const { self } = topPositions;

    let embed = cloneDeep(_embed);

    embed = {
        ...embed,
        title: "Top leaderboard ranks",
        description: `Top 1000 ranks: **${topPositions.positions.filter(a => a.rank <= 1000).length}**`,
        author: {
            icon_url: `https://crafatar.com/avatars/${self.uuid}?size=128&overlay`,
            name: self.username,
            url: `https://sky.lea.moe/stats/${self.uuid}`
        },
        fields: []
    };

    const totalPages = Math.floor(topPositions.positions.length / topPositions.count) + 1;

    embed.footer = { text: `Page ${topPositions.page} / ${totalPages}` };

    const startPosition = (topPositions.page - 1) * topPositions.count;

    const positions = topPositions.positions
        .slice(startPosition, startPosition + topPositions.count);

    for (const [index, position] of positions.entries()) {
        embed.fields.push({
            name: `#${position.rank.toLocaleString()} in ${position.leaderboard.name}`,
            value: typeof position.amount === 'number' ? position.amount.toLocaleString() : position.amount,
            inline: true
        });

        if (index % 2 == 1)
            embed.fields.push({
                name: "⠀",
                value: "⠀",
                inline: true
            });
    }

    return embed;
};

const topPositionsCollector = async function (i, embed, row, topPositions) {
    switch (i.customId) {
        case 'left':
            topPositions.page = Math.max(1, topPositions.page - 1);
            break;
        case 'right':
            topPositions.page = Math.min(topPositions.page + 1, Math.floor(topPositions.positions.length / topPositions.count) + 1);
            break;
    }

    try {
        await i.update({ embeds: [drawTopPositions(embed, topPositions)], components: [row] });
    } catch (e) {
        helper.error(e);
    }
};

class LeaderboardsCommand extends Command {
    command = 'lb';
    description = "Check leaderboards.";
    example = [
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
        },
        {
            run: "lb alchemy xp m:iron",
            result: `Top leaderboard positions for Alchemy XP on ironman profiles.`
        }
    ];
    options = [
        {
            name: 'leaderboard',
            description: 'Select leaderboard to show',
            type: 3,
            autocomplete: true
        }, {
            name: 'username',
            description: 'Select user to show',
            type: 3
        }, {
            name: 'guild',
            description: 'Select user to show within a guild',
            type: 3
        }, {
            name: 'mode',
            description: 'Limit to specific gamemode',
            type: 3,
            choices: [
                {
                    name: 'Ironman',
                    value: 'ironman'
                }
            ]
        }, {
            name: 'rank',
            description: 'Skip to a specific leaderboard rank',
            type: 4,
            min_value: 1
        }
    ];

    async autocomplete(obj) {
        const { interaction } = obj;

        const query = interaction.options.getString('leaderboard');

        const matches = helper.getLeaderboard(query, leaderboards, 8);

        return await interaction.respond(matches.map(m => {
            return {
                name: m.name,
                value: m.key
            };
        }));
    }
    
    async call(obj) {
        const { extendedLayout, interaction } = obj;

        const args = [];
        const params = { count: extendedLayout ? 10 : 4, page: 1 };

        let embed = {
            color: helper.mainColor,
            fields: [],
            footer: {}
        };

        if (config.credentials.sky_api_key != null)
            params.key = config.credentials.sky_api_key;

        const leaderboard = interaction.options.getString('leaderboard');
        const username = interaction.options.getString('username');
        const guild = interaction.options.getString('guild');
        const mode = interaction.options.getString('mode');
        const rank = interaction.options.getInteger('rank');

        if (leaderboard == null && username == null) {
            return await interaction.editReply({ embeds: [{
                color: helper.mainColor,
                description: 'Please specify either a leaderboard or a user.'
            }] });
        }

        if (username) {
            params.find = username;
        }

        if (guild) {
            params.guild = guild;
        }

        if (mode) {
            params.mode = mode;
        }

        if (rank) {
            params.page = Math.floor(rank / params.count);
            params.rank = rank;
        }

        const buttons = [
            {
                customId: 'left',
                label: '<',
                style: 'SECONDARY'
            }, {
                customId: 'right',
                label: '>',
                style: 'SECONDARY'
            }
        ];

        let topPositions, self;

        await interaction.deferReply();

        if (leaderboard == null) {
            try {
                const response = await helper.apiRequest(`/api/v2/leaderboards/${params.find}`);
                const data = await response.json();

                topPositions = { ...data, page: 1, count: params.count };

                embed = drawTopPositions(embed, topPositions);
            } catch (e) {
                embed = errorHandler(e, embed);
            }
        } else {
            const lbObj = await drawLeaderboard(embed, leaderboard, params);

            embed = lbObj.embed;
            self = lbObj.self;

            buttons.unshift(
                {
                    customId: 'more-left',
                    label: '<<',
                    style: 'PRIMARY'
                }
            );

            buttons.push(
                {
                    customId: 'more-right',
                    label: '>>',
                    style: 'PRIMARY'
                }
            );
        }

        buttons.forEach(b => b.type = 'BUTTON');

        const row = new MessageActionRow();

        row.setComponents(...buttons);

        const message = await interaction.editReply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, idle: 120_000 });

        if (leaderboard == null)
            collector.on('collect', i => {
                topPositionsCollector(i, embed, row, topPositions)
            });
        else
            collector.on('collect', i => {
                leaderboardCollector(i, embed, row, params, leaderboard, self)
            });

        collector.on('end', async () => {
            await interaction.editReply({ embeds: [embed], components: [] });
        });

        return message;
    }
}

export default LeaderboardsCommand;
