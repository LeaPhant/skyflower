const { formatNumber } = require('../helper.js');
const config = require('../config.json');
const axios = require('axios');
const math = require('mathjs');

module.exports = {
    command: 'bazaar',
    argsRequired: 1,
    description: [
        "Check prices for items on Bazaar.",
    ],
    usage: '[amount] <item>',
    example: [
        {
            run: "bazaar enchanted iron ingot",
            result: `Returns Bazaar price for Enchanted Iron Ingot.`
        },
        {
            run: "bazaar 5 sc3k",
            result: `Returns Bazaar price for 5 Super Compactor 3000s.`
        },
        {
            run: "bazaar 10 stacks catas",
            result: `Returns Bazaar price for 10 stacks of Catalysts.`
        }
    ],
    call: async obj => {
        const { argv, db } = obj;

        let amount;
        let stacks = false;
        let item;
        let itemSearch = "";

        if(!isNaN(parseInt(argv[1])))
            amount = math.evaluate(argv[1]);

        if(amount !== undefined && argv.length < 2)
            return helper.commandHelp(module.exports.command);

        if(amount !== undefined && ['stack', 'stacks'].includes(argv[2].toLowerCase())){
            stacks = true;

            itemSearch = argv.slice(3);
        }else{
            itemSearch = argv.slice(2);
        }

        if(amount == undefined)
            itemSearch = argv.slice(1);

        itemSearch = itemSearch.join(" ").toLowerCase();

        let itemResults = await db
        .collection('items')
        .find({ $text: { $search: itemSearch }})
        .toArray();

        if(itemResults.length == 0)
            throw "No matching item found.";

        let resultMatch;

        for(const result of itemResults){
            if(result.name.toLowerCase() == itemSearch)
                resultMatch = result;

            if('tag' in result)
                result.tag = result.tag.split(" ");
            else
                result.tag = [];

            result.tag.push(...result.name.toLowerCase().split(" "));

            result.tagMatches = 0;

            for(const part of itemSearch.split(" "))
                for(const tag of result.tag)
                    if(tag == part)
                        result.tagMatches++;
        }

        itemResults = itemResults.sort((a, b) => b.tagMatches - a.tagMatches);

        if(!resultMatch)
            resultMatch = itemResults[0];

        const bazaarResponse = await axios('https://sky.lea.moe/api/bazaar');
        const products = bazaarResponse.data;

        const matchProducts = products.filter(a => a.id == resultMatch.id);

        if(matchProducts.length == 0)
            throw "No matching item found.";

        const bazaarProduct = matchProducts[0];

        let fields = [
            {
                name: "Buy Price",
                value: formatNumber(bazaarProduct.buyPrice, false, 100),
                inline: true
            },
            {
                name: "Sell Price",
                value: formatNumber(bazaarProduct.sellPrice, false, 100),
                inline: true
            }
        ];

        if(amount || amount == 0){
            if(stacks){
                const name = amount > 1 ? `Buy ${amount.toLocaleString()} × 64` : `Buy 64`;

                fields = [{
                    name: `Buy ${amount.toLocaleString()} × 64`,
                    value: amount == 0 ? 'Free' : formatNumber(amount * 64 * bazaarProduct.buyPrice, false, 100),
                    inline: true
                }, {
                    name: `Sell ${amount.toLocaleString()} × 64`,
                    value: amount == 0 ? 'Free' : formatNumber(amount * 64 * bazaarProduct.sellPrice, false, 100),
                    inline: true
                }];
            }else{
                fields = [{
                    name: `Buy ${amount.toLocaleString()}`,
                    value: amount == 0 ? 'Free' : formatNumber(amount * bazaarProduct.buyPrice, false, 100),
                    inline: true
                }, {
                    name: `Sell ${amount.toLocaleString()}`,
                    value: amount == 0 ? 'Free' : formatNumber(amount * bazaarProduct.sellPrice, false, 100),
                    inline: true
                }];
            }
        }

        return { embed: {
            color: 11809405,
            title: resultMatch.name,
            thumbnail: {
                url: `https://sky.lea.moe/item/${resultMatch.id}`
            },
            fields,
            footer: {
                icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/704802034217648188/8efff00435c84dab9d0c2efd41e1f0b6.png",
                text: "Bazaar – prices update every minute"
            }
        }};
    }
};
