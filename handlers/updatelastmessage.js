const helper = require('../helper');

module.exports = {
    message: async obj => {
        let { client, msg, prefix, db } = obj;

        const guildId = msg.guild != null ? msg.guild.id : 'me';

        if(msg.content.startsWith(prefix) 
        || msg.author.id == client.user.id 
        || msg.content == false)
            return;
        
        db.set(`lm_${guildId}_${msg.channel.id}`, msg.content).catch(helper.error);
    }
};
 
