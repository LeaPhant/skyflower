import Command from '../command.js';

import { startCase, lowerCase } from 'lodash-es';
import { MessageActionRow } from 'discord.js';
import { bold, italic } from '@discordjs/builders';
import helper from '../helper.js';
import config from '../config.json' assert { type: 'json' };

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
    12: 50000,
    13: 100000
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

const BESTIARY_MAX = 41;

const PER_PAGE = 9;

const BESTIARY = {
    PRIVATE_ISLAND: [
        {
            id: 'cave_spider',
            max: 5
        },
        {
            name: 'Enderman',
            id: 'enderman_private',
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
        },
        {
            id: 'zombie',
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
    CRIMSON_ISLE: [
        {
            id: 'ashfang',
            boss: true
        },
        {
            id: 'barbarian_duke_x',
            boss: true
        },
        {
            id: 'bladesoul',
            boss: true
        },
        {
            id: 'mage_outlaw',
            boss: true
        },
        {
            id: 'magma_cube_boss',
            boss: true
        },
        'flaming_spider',
        'blaze',
        'ghast',
        'magma_cube',
        'matcho',
        {
            name: 'Mushroom Bull',
            id: 'charging_mushroom_cow',
        },
        'pigman',
        'wither_skeleton',
        'wither_spectre'
    ],
    THE_END: [
        {
            name: 'Ender Dragon',
            id: 'dragon',
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
        },
        {
            name: 'Obsidian Defender',
            id: 'obsidian_wither'
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
        'goblin',
        {
            name: 'Grunt',
            id: 'team_treasurite'
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
            id: 'worms',
            name: 'Worm'
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
        // 'skeletor_prime',
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
            name: 'Undead Skeleton',
            id: 'dungeon_respawning_skeleton'
        },
        {
            name: 'Withermancer',
            id: 'crypt_witherskeleton'
        },
        'skeletor',
        {
            name: 'Undead',
            id: 'watcher_summon_undead'
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

    entry.boss = e.boss == true;
    entry.max = e.max ?? BESTIARY_MAX;

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

const formatArea = a => {
    return bold(startCase(a.toLowerCase()));
}

for (const b in BESTIARY)
    BESTIARY[b] = BESTIARY[b].map(extendEntry);

class BestiaryCommand extends Command {
    command = 'bestiary';
    description = "Check bestiary for a player.";
    options = [
        ...helper.profileOptions,
        {
            name: 'exclude',
            description: 'Exclude mobs from specific areas (seperate multiple with ,)',
            type: 3
        }, {
            name: 'include',
            description: 'Only include mobs from specific areas (separate multiple with ,)',
            type: 3
        }
    ];
    
    async call(obj) {
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

        let totalLevel = 0;
        
        for (const area in BESTIARY) {
            const bestiaryArea = BESTIARY[area];

            for (const bestiaryEntry of bestiaryArea) {
                let b = { ...bestiaryEntry };

                b.kills = 0;

                for (const id of b.id) {
                    b.kills += profile?.raw?.bestiary[`kills_family_${id}`] ?? 0;
                }

                b = { ...b, ...getBestiaryLevel(b) };

                totalLevel += b.level;

                if (areas.includes(area))
                    bestiary.push(b);
            }
        }

        const closestLevelUps = bestiary.filter(a => !a.max && !a.boss).sort((a, b) => a.killsLeft - b.killsLeft);

        let page = 0;
        let currentType = 0;
        let currentArray = closestLevelUps;

        const TYPES = ['closest', 'highest', 'lowest'];

        const buttons = [
            {
                customId: 'left',
                label: '<',
                disabled: true,
                style: 'SECONDARY'
            }, {
                customId: 'right',
                label: '>',
                style: 'SECONDARY'
            },
            {
                customId: 'closest',
                label: 'Closest',
                disabled: true,
                style: 'PRIMARY'
            }, {
                customId: 'highest',
                label: 'Highest',
                style: 'PRIMARY'
            }, {
                customId: 'lowest',
                label: 'Lowest',
                style: 'PRIMARY'
            }
        ];

        buttons.forEach(b => b.type = 'BUTTON');

        if (currentArray.length < PER_PAGE)
            buttons[1].disabled = true;

        const row = new MessageActionRow();

        row.setComponents(...buttons);

        const show = () => {
            let title;
            let description = '';

            switch(currentType) {
                case 0:
                    title = "Closest level ups";
                    break;
                case 1:
                    title = "Highest levels";
                    break;
                case 2:
                    title = "Lowest levels";
            }

            if (includingAreas.size > 0) {
                const list = [...includingAreas].map(a => `${formatArea(a)}`);

                description += `Only including mobs in ${list.join(', ')}.`;
            } else if (excludingAreas.size > 0) {
                const list = [...excludingAreas].map(a => `${formatArea(a)}`);

                description += `Excluding mobs in ${list.join(', ')}.`;
            }

            const fields = [];

            const startIndex = PER_PAGE * page;

            const maxPage = Math.floor(currentArray.length / PER_PAGE);

            for (const b of currentArray.slice(startIndex, startIndex + PER_PAGE)) {
                let name = `${b.name} ${b.level}`;

                const value = b.max
                    ? `Total Kills: ${bold(b.kills)}`
                    : `Kills: ${bold(b.currentKills)} / ${b.nextStep}`;

                fields.push({
                    name,
                    value,
                    inline: true
                });
            }

            const text = `Bestiary Milestone: ${(totalLevel / 10).toFixed(1)}`
                + helper.sep
                + `Page ${page + 1}/${maxPage + 1}`;

            return {
                color: helper.mainColor,
                title,
                author: {
                    icon_url: `https://minotar.net/helm/${profile.data.uuid}/64`,
                    name: `${profile.data.display_name}'s Bestiary (${profile.cute_name})`,
                    url: `https://sky.lea.moe/stats/${profile.data.uuid}/${profile.data.profile.profile_id}`,
                },
                description,
                fields,
                footer: {
                    text
                }
            };
        };

        await interaction.editReply({ embeds: [show()], components: [row] });

        const reply = await interaction.fetchReply();

        const filter = i => i.user.id === interaction.user.id;
        const collector = reply.createMessageComponentCollector({ filter, idle: 120_000 });

        collector.on('collect', async i => {
            switch(i.customId) {
                case 'left':
                    page = Math.max(0, page - 1);
                    break;
                case 'right':
                    page = Math.min(Math.floor(currentArray.length / PER_PAGE), page + 1);
                    break;
                case 'closest':
                    page = 0;
                    currentType = 0;
                    currentArray = closestLevelUps;
                    break;
                case 'highest':
                    page = 0;
                    currentType = 1;
                    currentArray = bestiary.sort((a, b) => b.level - a.level);
                    break;
                case 'lowest':
                    page = 0;
                    currentType = 2;
                    currentArray = bestiary.sort((a, b) => a.level - b.level);
                    break;
            }

            buttons.forEach(b => b.disabled = false);

            if (page == 0) {
                buttons[0].disabled = true;
            } else {
                buttons[0].disabled = false;
            }

            if (page == Math.floor(currentArray.length / PER_PAGE)) {
                buttons[1].disabled = true;
            } else {
                buttons[1].disabled = false;
            }

            buttons[currentType + 2].disabled = true;

            row.setComponents(...buttons);

            await i.update({ embeds: [show()], components: [row] });
        });

        collector.on('end', async () => {
            await interaction.editReply({ embeds: [show()], components: [] });
        });
    }
};

export default BestiaryCommand;
