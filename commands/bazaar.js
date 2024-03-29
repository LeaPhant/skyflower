import Command from '../command.js';

import helper from '../helper.js';
import { bold } from '@discordjs/builders';
import numeral from 'numeral';
import config from '../config.json' assert { type: 'json' };
import { round } from 'lodash-es';
import fetch from 'node-fetch';
import * as math from 'mathjs';

let products = {};

const updateProducts = async () => {
    try{
        const bazaarResponse = await helper.apiRequest('/api/v2/bazaar');

        if (!bazaarResponse.ok)
            return;

        products = await bazaarResponse.json();

        for (const productId in products) {
            const product = products[productId];

            if (product.tag != null)
                product.tag = product.tag.split(" ");
            else
                product.tag = [];

            product.tag.push(...product.name.toLowerCase().split(" "));
        }
    } catch(e) {
        helper.error(e);
    }
}

updateProducts();
setInterval(updateProducts, 60 * 1000);

const normalizeCost = cost => {
    if (cost === 0)
        return 'Free';

    const formattedCost = numeral(cost).format('0.00a');
    
    if (cost === Infinity || formattedCost === 'NaNt')
        return Infinity.toLocaleString();

    return formattedCost;
};

class BazaarCommand extends Command {
    command = 'bazaar';
    description = "Check prices for one or more items on Bazaar.";
    options = [{
        name: 'items',
        description: 'Query for one or multiple items (e.g. 128 e cocoa + 32 wheat)',
        type: 3,
        required: true
    }];
    example = [
        {
            run: "bazaar enchanted iron ingot",
            result: `Bazaar price for Enchanted Iron Ingot.`
        },
        {
            run: "bazaar 10 stacks catas",
            result: `Bazaar price for 10 stacks of Catalysts.`
        },
        {
            run: "bazaar 3 stacks estring + 3 stacks ebone",
            result: "Total summary for 3 stacks of Enchanted String and 3 stacks of Enchanted Bone"
        },
        {
            run: "bazaar 50m summoning eye",
            result: "Amount of summoning eyes you have to buy/sell to spend/earn 50 million coins"
        }
    ];

    async call(obj) {
        const { interaction, extendedLayout } = obj;

        let item;
        let itemSearch = "";

        let commandText = interaction.options.get('items');

        let summary = commandText.value.split(" + ");

        let embed = {
            color: helper.mainColor,
            fields: [],
            footer: {
                icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
                text: `sky.lea.moe${helper.sep}/bazaar [amount] <item>`
            },
        };

        const additionalItems = [];

        let description = "";

        let totalBuy = 0;
        let totalSell = 0;

        let coinsMode = false;
        let xpMode = false;

        for (const [index, part] of summary.entries()) {
            let stacks = false;

            const argv_ = part.split(" ");

            let amount;
            coinsMode = false;

            if (['k', 'm', 'b'].includes(argv_[0].charAt(argv_[0].length - 1).toLowerCase()) && !isNaN(parseFloat(argv_[0]))) {
                amount = parseFloat(argv_[0]);

                switch (argv_[0].charAt(argv_[0].length - 1).toLowerCase()) {
                    case 'b':
                        amount *= 1000;
                    case 'm':
                        amount *= 1000;
                    case 'k':
                        amount *= 1000;
                }

                coinsMode = true;
            } else if (argv_[0].toLowerCase().endsWith('xp') && !isNaN(parseFloat(argv_[0]))) {
                const xpAmount = parseFloat(argv_[0]);
                const xpBoxes = Math.ceil(xpAmount / 20000);

                amount = Math.ceil(xpBoxes / 0.1293);
                itemSearch = ['Purple','Jerry','Box'];

                xpMode = true;
            } else if (!isNaN(parseInt(argv_[0]))) {
                const expression = argv_[0].replace(/x/g, '*');

                try {
                    amount = Math.ceil(math.evaluate(expression));
                } catch (e) {
                    throw new Error(`Couldn't evaluate mathematical expression: \`${expression.replace(/\`/g, '')}\``);
                }
            }

            if (amount !== undefined && argv_.length < 1)
                return await helper.commandHelp(module.exports.command, prefix);

            if (amount !== undefined && argv_.length < 2 && !xpMode)
                throw new Error("Please specify an item name.");

            if (!xpMode && amount !== undefined && ['stack', 'stacks'].includes(argv_[1].toLowerCase())) {
                stacks = true;

                itemSearch = argv_.slice(2);
            } else if (!xpMode) {
                itemSearch = argv_.slice(1);
            }

            if (amount == undefined)
                itemSearch = argv_;

            for (const [index, part] of itemSearch.entries()) {
                if (part == 'e' || part == 'ench')
                    itemSearch[index] = 'enchanted';
            }

            itemSearch = itemSearch.join(" ").toLowerCase();

            const bazaarProduct = helper.getBazaarProduct(itemSearch, products);

            let itemName = "";

            if (summary.length > 1) {
                if (index < 6 && extendedLayout || index < 3 && summary.length < 3 && !extendedLayout) {
                    embed.fields.push({
                        name: `${bazaarProduct.name}⠀`,
                        value: "⠀",
                        inline: true
                    });
                } else {
                    additionalItems.push({ amount: amount ?? 1, name: bazaarProduct.name, coinsMode });
                }
            }

            if (amount || amount == 0) {
                if (coinsMode) {
                    let buyText = "";
                    let sellText = "";

                    const itemsBuy = Math.floor(amount / bazaarProduct.buyPrice);
                    const itemsSell = Math.ceil(amount / bazaarProduct.sellPrice);

                    buyText += `Buy ${itemsBuy.toLocaleString()}`;
                    sellText += `Sell ${itemsSell.toLocaleString()}`;

                    let buyStacks = `${round(itemsBuy / 64, 1).toLocaleString()} × 64`;
                    let sellStacks = `${round(itemsSell / 64, 1).toLocaleString()} × 64`;

                    if (itemsBuy >= 128 && itemsSell >= 128) {
                        buyText += ` (${buyStacks})`;
                        sellText += ` (${sellStacks})`;
                    }

                    if (itemsBuy >= 1280 && itemsSell >= 1280) {
                        buyText = buyStacks;
                        sellText = sellStacks;
                    }

                    totalBuy += itemsBuy * bazaarProduct.buyPrice;
                    totalSell += itemsSell * bazaarProduct.sellPrice;

                    if (index < 6) {
                        embed.fields.push({
                            name: `Spend ${numeral(amount).format('0.0a')}`,
                            value: buyText,
                            inline: true
                        }, {
                            name: `Earn ${numeral(amount).format('0.0a')}`,
                            value: sellText,
                            inline: true
                        });
                    }
                } else {
                    if (stacks) {
                        const name = amount > 1 ? `Buy ${amount.toLocaleString()} × 64` : `Buy 64`;

                        let buyCost = amount * 64 * bazaarProduct.buyPrice;
                        let sellCost = amount * 64 * bazaarProduct.sellPrice;

                        totalBuy += buyCost;
                        totalSell += sellCost;

                        if (index < 6) {
                            embed.fields.push({
                                name: `Buy ${amount.toLocaleString()} × 64`,
                                value: normalizeCost(buyCost),
                                inline: true
                            }, {
                                name: `Sell ${amount.toLocaleString()} × 64`,
                                value: normalizeCost(sellCost),
                                inline: true
                            });
                        }
                    } else {
                        let buyCost = amount * bazaarProduct.buyPrice;
                        let sellCost = amount * bazaarProduct.sellPrice;

                        totalBuy += buyCost;
                        totalSell += sellCost;

                        if (index < 6) {
                            embed.fields.push({
                                name: `Buy ${amount.toLocaleString()}`,
                                value: normalizeCost(buyCost),
                                inline: true
                            }, {
                                name: `Sell ${amount.toLocaleString()}`,
                                value: normalizeCost(sellCost),
                                inline: true
                            });
                        }
                    }
                }
            } else {
                totalBuy += bazaarProduct.buyPrice;
                totalSell += bazaarProduct.sellPrice;

                if (index < 6) {
                    embed.fields.push({
                        name: "Buy Price",
                        value: numeral(bazaarProduct.buyPrice).format('0.00a'),
                        inline: true
                    }, {
                        name: "Sell Price",
                        value: numeral(bazaarProduct.sellPrice).format('0.00a'),
                        inline: true
                    });
                }
            }

            if (summary.length == 1) {
                embed.title = bazaarProduct.name,
                embed.url = `https://www.skyblock.bz/product/${bazaarProduct.id}`
                embed.thumbnail = {
                    url: `https://sky.lea.moe/item/${bazaarProduct.id}`
                }
            }
        }

        for (const [index, item] of additionalItems.entries()) {
            if (index > 0)
                description += ' + ';

            const amount = item.coinsMode ? numeral(item.amount).format('0.0a') : item.amount.toLocaleString();

            description += `${bold(amount)} ${item.name}`;

            if (index % 2 == 1)
                description += '\n';
        }

        if (summary.length > 1) {
            embed.title = "Bazaar Summary";

            if (summary.length > 6) {
                embed.fields.push({
                    name: `${summary.length - 6} more item${summary.length == 7 ? '' : 's'}…`,
                    value: `(${description})`,
                    inline: false
                });
            }

            const summaryTotal = [{
                name: "Summary",
                value: "⠀",
                inline: true
            }, {
                name: coinsMode ? "Spend Total" : "Buy Total",
                value: numeral(totalBuy).format('0.00a'),
                inline: true
            }, {
                name: coinsMode ? "Earn Total" : "Sell Total",
                value: numeral(totalSell).format('0.00a'),
                inline: true
            }];

            if (!extendedLayout && summary.length > 2) {
                embed.description = ` \\> ${description}`;
                embed.fields = summaryTotal;
            } else {
                embed.fields.push(...summaryTotal);
            }
        }

        await interaction.reply({ embeds: [embed] });
    }
};

export default BazaarCommand;
