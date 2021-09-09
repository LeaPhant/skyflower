const helper = require('../helper');
const config = require('../config.json');
const axios = require('axios');
const { CancelToken } = axios;
const _ = require('lodash');

let items;

const updateItems = async function(){
    try{
        const itemsResponse = await axios(`https://api.slothpixel.me/api/skyblock/items`);

        items = itemsResponse.data;
    }catch(e){
        helper.error(e);
    }
}

updateItems();
setInterval(updateItems, 60 * 1000);

const FORGE_TIMES = {
    REFINED_DIAMOND: 8 * 60,
    REFINED_MITHRIL: 6 * 60,
    REFINED_TITANIUM: 12 * 60,
    FUEL_TANK: 10 * 60,
    BEJEWELED_HANDLE: 30,
    DRILL_ENGINE: 30 * 60,
    GOLDEN_PLATE: 6 * 60,
    MITHRIL_PLATE: 18 * 60,
    GEMSTONE_MIXTURE: 4 * 60,
    PERFECT_JASPER_GEM: 20 * 60,
    PERFECT_RUBY_GEM: 20 * 60,
    PERFECT_JADE_GEM: 20 * 60,
    PERFECT_SAPPHIRE_GEM: 20 * 60,
    PERFECT_AMBER_GEM: 20 * 60,
    PERFECT_TOPAZ_GEM: 20 * 60,
    PERFECT_AMETHYST_GEM: 20 * 60,
    BEACON_2: 20 * 60,
    BEACON_3: 30 * 60,
    BEACON_4: 40 * 60,
    BEACON_5: 50 * 60,
    TITANIUM_TALISMAN: 14 * 60,
    TITANIUM_RING: 20 * 60,
    TITANIUM_ARTIFACT: 26 * 60,
    TITANIUM_RELIC: 3 * 24 * 60,
    TITANIUM_DRILL_1: 40 * 60,
    TITANIUM_DRILL_2: 0.5,
    TITANIUM_DRILL_3: 0.5,
    TITANIUM_DRILL_4: 0.5,
    MITHRIL_DRILL_1: 4 * 60,
    MITHRIL_DRILL_2: 0.5,
    MITHRIL_PICKAXE: 45,
    POWER_CRYSTAL: 2 * 60,
    REFINED_MITHRIL_PICKAXE: 22 * 60,
    MITHRIL_FUEL_TANK: 10 * 60,
    MITHRIL_DRILL_ENGINE: 15 * 60,
    PURE_MITHRIL: 12 * 60,
    ROCK_GEMSTONE: 22 * 60,
    PETRIFIED_STARFALL: 14 * 60,
    GOBLIN_OMELETTE: 18 * 60,
    GOBLIN_OMELETTE_PESTO: 20 * 60,
    GOBLIN_OMELETTE_SUNNY_SIDE: 20 * 60,
    GOBLIN_OMELETTE_SPICY: 20 * 60,
    GOBLIN_OMELETTE_BLUE_CHEESE: 20 * 60,
    GEMSTONE_DRILL_1: 1 * 60,
    GEMSTONE_DRILL_2: 0.5,
    GEMSTONE_DRILL_3: 0.5,
    GEMSTONE_DRILL_4: 0.5,
    HOT_STUFF: 24 * 60,
    AMBER_MATERIAL: 7 * 60,
    TITANIUM_FUEL_TANK: 25 * 60,
    TITANIUM_DRILL_ENGINE: 30 * 60,
    GEMSTONE_CHAMBER: 4 * 60,
    RUBY_POLISHED_DRILL_ENGINE: 20 * 60,
    GEMSTONE_FUEL_TANK: 30 * 60,
    PERFECTLY_CUT_FUEL_TANK: 2 * 24 * 60 + 2 * 60,
    SAPPHIRE_POLISHED_DRILL_ENGINE: 20 * 60,
    AMBER_POLISHED_DRILL_ENGINE: 2 * 24 * 60 + 2 * 60,
    HELMET_OF_DIVAN: 23 * 60,
    CHESTPLATE_OF_DIVAN: 23 * 60,
    LEGGINGS_OF_DIVAN: 23 * 60,
    BOOTS_OF_DIVAN: 23 * 60,
    DIVAN_DRILL: 2 * 24 * 60 + 12 * 60,
    PET: 12 * 24 * 60
};

module.exports = {
    command: ['forge'],
    argsRequired: 1,
    description: [
        "Check forge for a player.",
    ],
    example: [
        {
            run: "forge leaphant",
            result: "Returns forge for LeaPhant."
        }
    ],
    usage: '<username> [profile name]',
    call: async obj => {
        const { guildId, argv, client, msg, prefix, responseMsg, endEmitter } = obj;

        extendedLayout = obj.extendedLayout;

        const footer = {
            icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/726040184638144512/logo_round.png",
            text: `sky.lea.moe${helper.sep}${prefix}forge <user> [profile]`
        }

        const msgObj = {
            embeds : [{
                color: helper.mainColor,
                author: {
                    name: `${argv[1]}'s Forge`
                },
                footer,
                description: `Awaiting API response... ${helper.emote('beespin', null, client)}`
            }]
        };

        let message = responseMsg;

        if(responseMsg)
            await responseMsg.edit(msgObj);
        else
            message = await msg.channel.send(msgObj);

        const source = CancelToken.source();

        axios.get(
            `${config.sky_api_base}/api/v2/profile/${argv[1]}`, 
            { 
                params: { key: config.credentials.sky_api_key },
                cancelToken: source.token
            }
        ).then(async response => {
            const { data } = response;

            console.log(data);

            let profile = data.profiles[_.findKey(data.profiles, a => a.current)];
            let customProfile;

            if(argv.length > 2){
                customProfile = argv[2].toLowerCase();

                for(const key in data.profiles)
                    if(data.profiles[key].cute_name.toLowerCase() == customProfile)
                        profile = data.profiles[key];
            }

            console.log(profile);

            if(!profile?.raw?.forge?.forge_processes?.forge_1){
                await message.edit({
                    embeds: [{
                        color: helper.errorColor,
                        author: {
                            name: 'Error'
                        },
                        footer,
                        description: 'Player has no items in forge.'
                    }]
                });
            }

            const forge = Object.values(profile.raw.forge.forge_processes.forge_1);

            let description = '';

            for(const [index, item] of forge.entries()){
                if(index > 0)
                    description += '\n';

                let name = item.id in items ? items[item.id].name : item.id;

                if(item.id == 'PET')
                    name = '[Lvl 1] Ammonite';

                description += `${name} ${helper.sep} Finished <t:${Math.floor(item.startTime / 1000) + FORGE_TIMES[item.id] * 60}:R>`;
            }

            const embed = {
                color: helper.mainColor,
                url: `https://sky.lea.moe/stats/${profile.data.uuid}/${profile.data.profile.profile_id}`,
                author: {
                    name: `${profile.data.display_name}'s Forge (${profile.cute_name})`,
                    url: `https://sky.lea.moe/stats/${profile.data.uuid}/${profile.data.profile.profile_id}`,
                },
                thumbnail: {
                    url: `https://minotar.net/helm/${profile.data.uuid}/128`
                },
                footer,
                description
            };

            console.log(embed);

            await message.edit({ embeds: [embed] });
        }).catch(console.error);

        return message;
    }
};