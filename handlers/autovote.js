const autovoteChannels = [
    "polls",
    "site-suggestions"
];

module.exports = {
    message: async obj => {
        const { msg } = obj;

        if(autovoteChannels.includes(msg.channel.name)){
            await msg.react("👍");
            await msg.react("👎");
        }
    }
};
