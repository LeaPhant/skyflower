const helper = require('../helper.js');

const rules = [
    {
        rule: 1,
        tags: ['hate', 'slur', 'slurs'],
        title: "Be nice to each other. 🌹",
        content: "**Any hate speech is prohibited** and will get you banned pretty quickly. This includes using ethnic/homophobic/transphobic slurs no matter the context. Abusing terms describing disablities or minorities in a derogatory context is also unwelcome."
    },
    {
        rule: 2,
        tags: ['nsfw'],
        title: "No NSFW content.",
        content: "No NSFW pictures, videos, memes or language."
    },
    {
        rule: 3,
        tags: ['hypixel', 'irl', 'scam', 'scams', 'scamming', 'skyblock'],
        title: "Don't break Hypixel rules.",
        content: "Participating in anything or discussing about anything that breaks Hypixel or SkyBlock rules isn't allowed. You can find the respective rules here: <https://hypixel.net/rules>, <https://hypixel.net/skyblock-rules>."
    },
    {
        rule: 4,
        tags: ['english', 'language', 'lang'],
        title: "Try to mostly speak English.",
        content: "This is to ensure making the server as accessible as possible to everyone."
    },
    {
        rule: 5,
        tags: ['personal', 'doxx', 'doxxing'],
        title: "Don't leak personal info.",
        content: "Don't send personal stuff like full names, phone numbers, (e-mail) addresses and the like, **even if it's faked**. This applies to both other people's and your own info."
    },
    {
        rule: 6,
        tags: ['advertise', 'invites', 'ref'],
        title: "Don't advertise.",
        content: "Don't advertise other Discord servers or send ref links and similar spam. This rule applies to both the server and DMs with other server members."
    },
    {
        rule: 7,
        tags: ['trading'],
        title: "No trading.",
        content: "Don't advertise trades or auctions, it doesn't belong in here. This rule is more of a guideline and isn't enforced, however I'd appreciate if you used other servers or platforms to trade since I can't and don't wanna moderate trades in case of scams and similar stuff."
    }
];

module.exports = {
    command: ['rules', 'rule', 'r'],
    description: "Display rules or a specific rule.",
    usage: '[rule number or name]',
    call: obj => {
        const { argv } = obj;

        let ruleArg;
        let outputRule;

        if(argv.length > 1)
            ruleArg = argv[1].toLowerCase().trim();

        if(ruleArg){
            if(isNaN(ruleArg)){
                for(const rule of rules)
                    if(rule.tags.includes(ruleArg))
                            outputRule = rule;
            }else if(parseInt(ruleArg) <= rules.length){
                outputRule = rules[parseInt(ruleArg) - 1];
            }
        }

        const embed = {
            color: 11809405,
            title: 'Rules',
            description: 'Please read the rules in <#680404415001526488>.'
        };

        if(outputRule){
            embed.title = `${outputRule.rule}. ${outputRule.title}`;
            embed.description = outputRule.content;

            embed.description += '\n\nRead the full rules in <#680404415001526488>.'
        }

        return { embed };
    }
};
