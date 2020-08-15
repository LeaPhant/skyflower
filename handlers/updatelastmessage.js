const helper = require('../helper');

module.exports = {
    message: async obj => {
        let { client, msg, prefix, db } = obj;

        if(msg.content.startsWith(prefix) 
        || msg.author.id == client.user.id 
        || msg.content == false)
            return;
        
        db.set(`lm_${msg.guild.id}_${msg.channel.id}`, msg.content).catch(helper.error);
    }
};
 
