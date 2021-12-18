import { startCase, lowerCase } from 'lodash-es';
import fetch from 'node-fetch';
import helper from '../helper.js';
import config from '../config.json';

const BESTIARY_LEVEL = {
    1: 10,
    2: 15,
    3: 75,
    4: 150,
    5: 250,
    6: 500,
    7: 1500,
    8: 2500,
    9: 5000,
    10: 15000,
    11: 25000,
    12: 100000
};

const BESTIARY_BOSS_LEVEL = {
    1: 2,
    2: 3,
    3: 5,
    4: 10,
    8: 25,
    10: 50,
    12: 100
};

const BESTIARY_BOSS_MAX = 41;

const BESTIARY = {
    PRIVATE_ISLAND: [
        {
            id: 'cave_spider',
            max: 5
        },
        {
            id: 'skeleton',
            max: 5
        },
        {
            id: 'slime',
            max: 5
        },
        {
            id: 'spider',
            max: 5
        },
        {
            id: 'witch',
            max: 5
        }
    ],
    HUB: [
        {
            name: "Crypt Ghoul",
            id: 'unburried_zombie'
        },
        'old_wolf',
        {
            name: 'Wolf',
            id: 'ruin_wolf'
        },
        'zombie_villager'
    ],
    "SPIDER'S_DEN": [
        {
            id: 'arachne',
            boss: true
        },
        {
            name: "Arachne's Brood",
            id: 'arachne_brood',
        },
        {
            name: "Arachne's Keeper",
            id: 'arachne_keeper'
        },
        {
            name: 'Brood Mother',
            id: 'brood_mother_spider',
            boss: true
        },
        'dasher_spider',
        {
            name: "Gravel Skeleton",
            id: 'respawning_skeleton'
        },
        {
            name: "Rain Slime",
            id: 'random_slime'
        },
        'spider_jockey',
        'splitter_spider',
        'voracious_spider',
        'weaver_spider'
    ],
    BLAZING_FORTRESS: [
        'blaze',
        'ghast',
        {
            name: 'Magma Cube',
            id: ['magma_cube', 'fireball_magma_cube']
        },
        {
            id: 'magma_cube_boss',
            boss: true
        },
        'pigman',
        'wither_skeleton'
    ],
    THE_END: [
        {
            name: 'Dragon',
            id: [
                'young_dragon', 'protector_dragon', 'strong_dragon', 'old_dragon',
                'unstable_dragon', 'wise_dragon', 'superior_dragon'
            ],
            boss: true
        },
        'enderman',
        'endermite',
        {
            name: 'Endstone Protector',
            id: 'corrupted_protector',
            boss: true
        },
        'voidling_extremist',
        'voidling_fanatic',
        'watcher',
        {
            name: 'Zealot',
            id: 'zealot_enderman'
        }
    ],
    DEEP_CAVERNS: [
        'automaton',
        'butterfly',
        'emerald_slime',
        {
            name: 'Ghost',
            id: 'caverns_ghost'
        },
        {
            name: 'Goblin',
            id: [
                'goblin_knife_thrower', 'goblin_weakling_melee', 'goblin_weakling_bow',
                'goblin', 'goblin_creepertamer', 'goblin_battler', 'goblin_golem',
                'goblin_murderlover', 'goblin_flamethrower'
            ]
        },
        {
            name: 'Grunt',
            id: [
                'team_treasurite_grunt', 'team_treasurite_wendy', 'team_treasurite_viper',
                'team_treasurite_corleone', 'team_treasurite_sebastian'
            ]
        },
        'ice_walker',
        'lapis_zombie',
        {
            name: 'Miner Skeleton',
            id: 'diamond_skeleton'
        },
        {
            name: 'Miner Zombie',
            id: 'diamond_zombie'
        },
        'redstone_pigman',
        'sludge',
        {
            name: 'Sneaky Creeper',
            id: 'invisible_creeper'
        },
        'thyst',
        'treasure_hoarder',
        {
            name: 'Worm',
            id: ['worm', 'scatha']
        },
        'yog'
    ],
    THE_PARK: [
        'howling_spirit',
        'pack_spirit',
        'soul_of_the_alpha'
    ],
    SPOOKY_FESTIVAL: [
        {
            name: 'Crazy Witch',
            id: 'batty_witch'
        },
        {
            id: 'headless_horseman',
            boss: true
        },
        'phantom_spirit',
        'scary_jerry',
        'trick_or_treater',
        'wither_gourd',
        'wraith'
    ],
    CATACOMBS: [
        {
            name: 'Angry Archeologist',
            id: 'diamond_guy'
        },
        'cellar_spider',
        'crypt_dreadlord',
        'crypt_lurker',
        'crypt_souleater',
        'king_midas',
        'lonely_spider',
        'lost_adventurer',
        'scared_skeleton',
        'shadow_assassin',
        'skeleton_grunt',
        'skeleton_master',
        'skeleton_soldier',
        'skeletor_prime',
        {
            name: 'Sniper',
            id: 'sniper_skeleton'
        },
        'super_archer',
        'super_tank_zombie',
        {
            name: 'Tank Zombie',
            id: 'crypt_tank_zombie'
        },
        {
            name: 'Crypt Undead',
            id: [
                'crypt_undead', 'crypt_undead_bernhard', 'crypt_undead_marius',
                'crypt_undead_alexander', 'crypt_undead_friedrich', 'crypt_undead_christian',
                'crypt_undead_nicholas', 'crypt_undead_valentin', 'crypt_undead_pieter'
            ]
        },
        {
            name: 'Undead Skeleton',
            id: 'dungeon_respawning_skeleton'
        },
        {
            name: 'Withermancer',
            id: 'crypt_witherskeleton'
        },
        'zombie_commander',
        'zombie_grunt',
        'zombie_knight',
        'zombie_soldier',
    ]
};

const extendEntry = e => {
    const entry = new Object();

    if (typeof e === 'string')
        entry.id = e;
    else
        Object.assign(entry, e);

    if (!Array.isArray(entry.id))
        entry.id = [entry.id];

    if (e.name === undefined)
        entry.name = startCase(entry.id[0]);

    entry.boss = e.boss === true;
    entry.max = e.max ?? (entry.boss ? BESTIARY_BOSS_MAX : null);

    return entry;
};

const getBestiaryLevel = b => {
    let kills = b.kills;
    let killsLeft = 0;
    let level = 0;
    let nextStep;

    const steps = b.boss ? BESTIARY_BOSS_LEVEL : BESTIARY_LEVEL;

    while (level < (b.max ?? Infinity)) {
        const step = Object.keys(steps).slice().reverse().find(a => a <= level + 1);
        nextStep = steps[step];

        if (kills >= nextStep) {
            level++;
            kills -= nextStep;
            continue;
        }

        killsLeft = nextStep - kills;
        break;
    }

    return {
        level,
        max: level == b.max,
        killsLeft,
        currentKills: kills,
        nextStep
    };
}

for (const b in BESTIARY) {
    BESTIARY[b] = BESTIARY[b].map(extendEntry);
}

export default {
    command: ['bestiary'],
    argsRequired: 1,
    description: [
        "Check bestiary for a player.",
    ],
    options: [
        {
            name: 'username',
            description: 'Player to retrieve bestiary for',
            type: 3,
            required: true
        }, {
            name: 'profile',
            description: 'Profile to retrieve bestiary for',
            type: 3
        }, {
            name: 'exclude',
            description: 'Exclude mobs from specific areas (seperate multiple with ,)',
            type: 3
        }, {
            name: 'include',
            description: 'Only include mobs from specific areas (separate multiple with ,)',
            type: 3
        }
    ],
    usage: '<username> [profile name]',
    call: async obj => {
        const { interaction } = obj;

        const profile = await helper.fetchProfile(interaction);

        let areas = Object.keys(BESTIARY);

        const excludingAreas = new Set();
        const excludeAreas = interaction.options.get('exclude')?.value;

        if (excludeAreas !== undefined) {
            for (const area of excludeAreas.split(',')) {
                const exclude = areas.filter(a => lowerCase(a).includes(area.toLowerCase()));
                exclude.forEach(a => excludingAreas.add(a));

                areas = areas.filter(a => exclude.includes(a) == false);
            }
        }

        const includingAreas = new Set();
        const includeAreas = interaction.options.get('include')?.value;

        if (includeAreas !== undefined) {
            for (const area of includeAreas.split(',')) {
                const include = areas.filter(a => lowerCase(a).includes(area.toLowerCase()));
                include.forEach(a => includingAreas.add(a));

                areas = areas.filter(a => include.includes(a));
            }
        }

        const bestiary = new Array();
        const filteredBestiary = new Array();

        let totalLevel = 0;
        
        for (const area in BESTIARY) {
            const bestiary = BESTIARY[area];

            for (const bestiaryEntry of bestiary) {
                let b = Object.assign({}, bestiaryEntry);

                b.kills = 0;

                for (const id of b.id) {
                    b.kills += profile?.raw?.stats[`kills_${id}`] ?? 0;

                    if (area == 'CATACOMBS') {
                        b.kills += profile?.raw?.stats[`kills_master_${id}`] ?? 0;
                    }
                }

                b = Object.assign(b, getBestiaryLevel(b));

                totalLevel += b.level;

                if (!b.boss && areas.includes(area))
                    filteredBestiary.push(b);
            }
        }

        let description = null;

        if (includingAreas.size > 0) {
            const list = [...includingAreas].map(a => `**${startCase(a.toLowerCase())}**`);

            description = `Only including mobs in ${list.join(', ')}.`;
        } else if (excludingAreas.size > 0) {
            const list = [...excludingAreas].map(a => `**${startCase(a.toLowerCase())}**`);

            description = `Excluding mobs in ${list.join(', ')}.`;
        }

        const fields = [];

        const closestLevelUps = filteredBestiary.filter(a => !a.max).sort((a, b) => a.killsLeft - b.killsLeft);

        for (const b of closestLevelUps.slice(0, 9)) {
            fields.push({
                name: `${b.name} ${b.level}`,
                value: `Kills: **${b.currentKills}** / ${b.nextStep}`,
                inline: true
            });
        }

        const embed = {
            color: helper.mainColor,
            url: `https://sky.lea.moe/stats/${profile.data.uuid}/${profile.data.profile.profile_id}`,
            author: {
                icon_url: `https://minotar.net/helm/${profile.data.uuid}/64`,
                name: `${profile.data.display_name}'s Bestiary (${profile.cute_name})`,
                url: `https://sky.lea.moe/stats/${profile.data.uuid}/${profile.data.profile.profile_id}`,
            },
            description,
            fields,
            footer: {
                text: `Approximate Bestiary Milestone: ${Math.floor(totalLevel / 10)}`
            }
        };

        await interaction.editReply({ embeds: [embed] });
    }
};
