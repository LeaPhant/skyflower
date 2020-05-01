const { formatNumber } = require('../helper.js');
const config = require('../config.json');
const axios = require('axios');
const math = require('mathjs');
const Levenshtein = require('levenshtein');

module.exports = {
    command: ['bazaar', 'bazzar', 'baz', 'b'],
    argsRequired: 1,
    description: [
        "Check prices for one or more items on Bazaar.",
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
        },
        {
            run: "bazaar 3 stacks estring + 3 stacks ebone",
            result: "Returns total summary for 3 stacks of Enchanted String and 3 stacks of Enchanted Bone"
        }
    ],
    call: async obj => {
        const { argv, db } = obj;

        let amount;
        let stacks = false;
        let item;
        let itemSearch = "";

        let commandText = argv.slice(1).join(" ");

        let summary = commandText.split(" + ");

        let embed = {
            color: 11809405,
            fields: [],
            footer: {
                icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/704802034217648188/8efff00435c84dab9d0c2efd41e1f0b6.png",
                text: "Bazaar – prices update every minute"
            }
        };

        let totalBuy = 0;
        let totalSell = 0;

        for(const part of summary){
            const argv_ = part.split(" ");

            if(!isNaN(parseInt(argv_[0])))
                amount = math.evaluate(argv_[0]);

            if(amount !== undefined && argv_.length < 1)
                return helper.commandHelp(module.exports.command);

            if(amount !== undefined && ['stack', 'stacks'].includes(argv_[1].toLowerCase())){
                stacks = true;

                itemSearch = argv_.slice(2);
            }else{
                itemSearch = argv_.slice(1);
            }

            if(amount == undefined)
                itemSearch = argv_;

            for(const [index, part] of itemSearch.entries()){
                if(part == 'e' || part == 'ench')
                    itemSearch[index] = 'enchanted';
            }

            itemSearch = itemSearch.join(" ").toLowerCase();

            let itemResults = await db
            .collection('items')
            .find({ bazaar: true, $text: { $search: itemSearch }})
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

                const l = new Levenshtein(result.name, itemSearch);

                result.distance = l.distance;

                for(const part of itemSearch.split(" "))
                    for(const tag of result.tag)
                        if(tag == part)
                            result.tagMatches++;
            }

            itemResults = itemResults.sort((a, b) => {
                if(a.tagMatches > b.tagMatches) return -1;
    	        if(a.tagMatches < b.tagMatches) return 1;

                if(a.distance < b.distance) return -1;
                if(a.distance > b.distance) return 1;
            });

            if(!resultMatch)
                resultMatch = itemResults[0];

            const bazaarResponse = await axios('https://sky.lea.moe/api/bazaar');
            const products = bazaarResponse.data;

            const matchProducts = products.filter(a => a.id == resultMatch.id);

            if(matchProducts.length == 0)
                throw "No matching item found.";

            const bazaarProduct = matchProducts[0];

            let itemName = "";

            if(summary.length > 1){
                embed.fields.push({
                    name: resultMatch.name,
                    value: "⠀",
                    inline: true
                });
            }

            if(amount || amount == 0){
                if(stacks){
                    const name = amount > 1 ? `Buy ${amount.toLocaleString()} × 64` : `Buy 64`;

                    totalBuy += amount * 64 * bazaarProduct.buyPrice;
                    totalSell += amount * 64 * bazaarProduct.sellPrice;

                    embed.fields.push({
                        name: `Buy ${amount.toLocaleString()} × 64`,
                        value: amount == 0 ? 'Free' : formatNumber(amount * 64 * bazaarProduct.buyPrice, false, 100),
                        inline: true
                    }, {
                        name: `Sell ${amount.toLocaleString()} × 64`,
                        value: amount == 0 ? 'Free' : formatNumber(amount * 64 * bazaarProduct.sellPrice, false, 100),
                        inline: true
                    });
                }else{
                    totalBuy += amount * bazaarProduct.buyPrice;
                    totalSell += amount * bazaarProduct.sellPrice;

                    embed.fields.push({
                        name: `Buy ${amount.toLocaleString()}`,
                        value: amount == 0 ? 'Free' : formatNumber(amount * bazaarProduct.buyPrice, false, 100),
                        inline: true
                    }, {
                        name: `Sell ${amount.toLocaleString()}`,
                        value: amount == 0 ? 'Free' : formatNumber(amount * bazaarProduct.sellPrice, false, 100),
                        inline: true
                    });
                }
            }else{
                totalBuy += bazaarProduct.buyPrice;
                totalSell += bazaarProduct.sellPrice;

                embed.fields.push({
                    name: "Buy Price",
                    value: formatNumber(bazaarProduct.buyPrice, false, 100),
                    inline: true
                }, {
                    name: "Sell Price",
                    value: formatNumber(bazaarProduct.sellPrice, false, 100),
                    inline: true
                });
            }

            if(summary.length == 1){
                embed.title = resultMatch.name,
                embed.thumbnail = {
                    url: `https://sky.lea.moe/item/${resultMatch.id}`
                }
            }
        }

        if(summary.length > 1){
            embed.title = "Bazaar Summary";

            embed.fields.push({
                name: "Summary",
                value: "⠀",
                inline: true
            }, {
                name: "Buy Total",
                value: formatNumber(totalBuy, false, 100),
                inline: true
            }, {
                name: "Sell Total",
                value: formatNumber(totalSell, false, 100),
                inline: true
            });
        }

        return { embed };
    }
};
