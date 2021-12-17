import fetch from 'node-fetch';
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
            id: 'enderman',
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
            id: 'brood_mother',
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
       'zealot'
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
        'sneaky_creeper',
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
        'skeleton_solider',
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
        'zombie_solider',
    ]
};

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
        }
    ],
    usage: '<username> [profile name]',
    call: async obj => {
        const { interaction } = obj;

        // TODO
    }
};
