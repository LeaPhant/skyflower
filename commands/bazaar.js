const { formatNumber } = require('../helper.js');
const config = require('../config.json');
const axios = require('axios');

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

        if(!isNaN(argv[1]))
            amount = parseInt(argv[1]);

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

        const itemResults = await db
        .collection('items')
        .find({ $text: { $search: itemSearch }})
        .toArray();

        if(itemResults.length == 0)
            throw "No matching item found.";

        let resultMatch;

        for(const result of itemResults)
            if(result.name.toLowerCase() == itemSearch)
                resultMatch = result;

        if(!resultMatch)
            resultMatch = itemResults[0];

        console.log(resultMatch);

        const bazaarResponse = await axios('https://sky.lea.moe/api/bazaar');
        const products = bazaarResponse.data;

        const matchProducts = products.filter(a => a.id == resultMatch.id);

        if(matchProducts.length == 0)
            throw "No matching item found.";

        const bazaarProduct = matchProducts[0];

        const fields = [
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

        if(amount){
            fields.push({
                name: "⠀",
                value: "⠀",
                inline: false
            });

            if(stacks){
                const name = amount > 1 ? `Buy ${amount.toLocaleString()} × 64` : `Buy 64`;

                fields.push({
                    name: `Buy ${amount.toLocaleString()} × 64`,
                    value: formatNumber(amount * 64 * bazaarProduct.buyPrice, false, 100),
                    inline: true
                }, {
                    name: `Sell ${amount.toLocaleString()} × 64`,
                    value: formatNumber(amount * 64 * bazaarProduct.sellPrice, false, 100),
                    inline: true
                });
            }else{
                fields.push({
                    name: `Buy ${amount.toLocaleString()}`,
                    value: formatNumber(amount * bazaarProduct.buyPrice, false, 100),
                    inline: true
                }, {
                    name: `Sell ${amount.toLocaleString()}`,
                    value: formatNumber(amount * bazaarProduct.sellPrice, false, 100),
                    inline: true
                });
            }
        }

        return { embed: {
            color: 11809405,
            title: resultMatch.name,
            thumbnail: {
                url: `https://sky.lea.moe/item/${resultMatch.id}`
            },
            fields
        }};
    }
};
