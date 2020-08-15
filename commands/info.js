const config = require('../config.json');

module.exports = {
    command: ['info', 'skybot', 'about'],
    argsRequired: 0,
    call: obj => {
        const { prefix } = obj;

        return { 
            embed: {
                color: 11809405,
                title: "skybot",
                description: `Discord bot with several commands to look up SkyBlock stats.\n\nFor a list of commands run \`${prefix}help\`.`,
                fields: [
                    {
                        name: "Links",
                        value: `[GitHub Repo](https://github.com/LeaPhant/skybot)
                        [Invite Link](https://discord.com/oauth2/authorize?client_id=${config.credentials.discord_client_id}&scope=bot&permissions=0)`
                    }
                ],
                footer: {
                    icon_url: "https://gravatar.com/avatar/835d26a4e37a323893b4339dea53aa81?s=128",
                    text: `LeaPhant`
                },
            }
        };
    }
};
