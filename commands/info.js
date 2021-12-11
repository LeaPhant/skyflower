import config from '../config.json';
import helper from '../helper.js';

export default {
    command: ['info', 'skyflower', 'about'],
    description: [
        "Show info about the bot."
    ],
    argsRequired: 0,
    call: async obj => {
        const { prefix, client } = obj;

        const embed = {
            color: helper.mainColor,
            title: "Sky Flower",
            description: `Open-source Discord bot with cool SkyBlock features`,
            thumbnail: {
                url: 'https://raw.githubusercontent.com/LeaPhant/skyflower/master/resources/icon_sky.png'
            },
            fields: [
                {
                    name: 'Settings',
                    value: `Default Prefix: \`${config.prefix}\`\nServer Prefix: \`${prefix}\``,
                },
                {
                    name: "Links",
                    value: `[Commands List](https://github.com/LeaPhant/skyflower#commands) • [GitHub Repo](https://github.com/LeaPhant/skyflower) • [Invite Link](https://discord.com/oauth2/authorize?client_id=${config.credentials.discord_client_id}&scope=bot&permissions=1073750016)`
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

        embed.description += `\nserving **${memberCount} Members** in **${guildCount} Servers**.`;
        embed.description += `\n\nFor a list of commands run \`${prefix}help\`.`;

        return { embed };
    }
};
