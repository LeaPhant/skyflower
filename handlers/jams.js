module.exports = {
    message: async obj => {
        const { msg } = obj;

        if(msg.channel.name == 'jams'
        && (msg.content.includes('https://') || msg.content.includes('http://'))
        && (msg.content.includes('youtube.com') || msg.content.includes('youtu.be')
        || msg.content.includes('soundcloud.com') || msg.content.includes('spotify.com'))){
            await msg.react('700237926302351360');
            await msg.react('700239443344359435');
            await msg.react('700241021027483709');
        }
    }
};
