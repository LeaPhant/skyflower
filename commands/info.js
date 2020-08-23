const config = require('../config.json');
const helper = require('../helper.js');

module.exports = {
    command: ['info', 'skybot', 'about'],
    argsRequired: 0,
    call: async obj => {
        const { prefix, client } = obj;

        const embed = {
            color: helper.mainColor,
            title: "Sky Flower",
            description: `Open-source Discord bot with cool SkyBlock features`,
            thumbnail: {
                url: 'https://raw.githubusercontent.com/LeaPhant/skyflower/master/resources/icon.png'
            },
            fields: [
                {
                    name: "Links",
                    value: `[GitHub Repo](https://github.com/LeaPhant/skyflower) • [Invite Link](https://discord.com/oauth2/authorize?client_id=${config.credentials.discord_client_id}&scope=bot&permissions=0)`
                }
            ],
            footer: {
                icon_url: "https://gravatar.com/avatar/835d26a4e37a323893b4339dea53aa81?s=128",
                text: `LeaPhant`
            },
        };

        const memberCountResponse = await client.shard.broadcastEval('this.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)');
        const guildCountResponse = await client.shard.fetchClientValues('guilds.cache.size');

        const memberCount = memberCountResponse.reduce((acc, count) => acc + count, 0).toLocaleString();
        const guildCount = guildCountResponse.reduce((acc, count) => acc + count, 0).toLocaleString();

        embed.description += `\nserving **${memberCount} Members** in **${guildCount} Guilds**.`;
        embed.description += `\n\nFor a list of commands run \`${prefix}help\`.`;

        return { embed };
    }
};
