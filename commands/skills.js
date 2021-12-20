import helper from '../helper.js';
import { bold } from '@discordjs/builders';
import numeral from 'numeral';
import config from '../config.json';

import { keys, capitalize, pickBy, upperFirst, startCase } from 'lodash-es';
import { MessageActionRow } from 'discord.js';
let extendedLayout;

const xpMax = {
    25: 3022425,
    30: 8022425,
    35: 15522425,
    40: 25522425,
    45: 38072425,
    50: 55172425,
    55: 85472425,
    60: 111672425
};

const xpMaxRunecrafting = {
    25: 94450
};

const skillsSorted = [
    "taming", "farming", "mining", "combat", "foraging", "fishing", "enchanting", "alchemy", "carpentry", "runecrafting"
];

const slayersSorted = [
    "zombie", "spider", "wolf"
];

const statModifier = (value, stat) => {
    let suffix = '';

    switch (stat) {
        case 'damage_increase':
            value = Math.floor(value * 100);
        case 'crit_chance':
        case 'crit_damage':
        case 'speed':
        case 'ability_damage':
        case 'sea_creature_chance':
            suffix = '%';
    }

    return value + suffix;
};

const skillEmbed = (profile, skillName, embed) => {
    const output = JSON.parse(JSON.stringify(embed));

    const skill = profile.data.levels[skillName];
    const name = upperFirst(skillName);

    output.author.name = `${profile.data.display_name}'s ${name} Skill (${profile.cute_name})`;

    const xpMaxRequired = skillName == 'runecrafting' ? xpMaxRunecrafting[skill.maxLevel] : xpMax[skill.maxLevel];

    const currentProgress = Math.floor(skill.xpCurrent / skill.xpForNext * 100);
    const progress = Math.floor(skill.xp / xpMaxRequired * 100);

    output.description = `Level: ${bold(skill.level)} / ${skill.maxLevel} (#${bold(skill.rank.toLocaleString())})\n`;

    if (skill.level == skill.maxLevel)
        output.description += `Current XP: ${bold(Math.floor(skill.xpCurrent).toLocaleString())}`;
    else
        output.description += `Current XP: ${bold(Math.floor(skill.xpCurrent).toLocaleString())} / `
        + `${skill.xpForNext.toLocaleString()} (${bold(currentProgress)}%)`;

    output.description += `\nTotal XP: ${bold(Math.floor(skill.xp).toLocaleString())} /`
    + `${xpMaxRequired.toLocaleString()} (${bold(progress)}%)`;

    let skillContext = false;

    switch (skillName) {
        case "taming":
            if ('petScore' in profile.data) {
                output.description += `\n\nPet Score: ${(bold(profile.data.petScore || 0).toLocaleString())}`;
                skillContext = true;
            }

            break;
        case "farming":
            if (!('collection' in profile.raw))
                break;

            const collections = [
                "WHEAT", "CARROT_ITEM", "POTATO_ITEM", "PUMPKIN", "MELON", 
                "SEEDS", "MUSHROOM_COLLECTION", "INK_SACK:3", "SUGAR_CANE"
            ];

            let cropsMined = 0;

            for (const cropCollection of keys(profile.raw.collection).filter(a => collections.includes(a)))
                cropsMined += profile.raw.collection[cropCollection];

            output.description += `\n\nCrops farmed: ${bold((cropsMined || 0).toLocaleString())}`;
            skillContext = true;

            break;
        case "combat":
            if (profile.data.kills.length > 0)
                output.description += `\n\n${profile.data.kills[0].entityName} Kills: `
                + bold((profile.data.kills[0].amount || 0).toLocaleString());

            if (profile.data.slayer_xp > 0) {
                output.description += `\nSlayer:`;

                for (const slayer of slayersSorted) {
                    if (!profile.data.slayers.hasOwnProperty(slayer))
                        continue;

                    const slayerLevel = profile.data.slayers[slayer].level;

                    if (slayerLevel.xp == 0)
                        continue;

                    output.description += bold(` ${capitalize(slayer)} ${slayerLevel.currentLevel} `)
                    + `(${bold(numeral(slayerLevel.xp).format('0.0a'))})`;
                }
            }

            skillContext = true;

            break;
        case "fishing":
            output.description += `\n\nItems fished: **${(profile.raw.stats.items_fished || 0).toLocaleString()}**`;
            skillContext = true;

            break;
        case "alchemy":
            if ('collection' in profile.raw) {
                output.description += `\n\nSugar Cane Collection: **${(profile.raw.collection.SUGAR_CANE || 0).toLocaleString()}**`;
                skillContext = true;
            }

            break;
        case "mining":
            if ('pet_milestone_ores_mined' in profile.raw.stats) {
                output.description += `\n\nOres Mined Milestone: **${(profile.raw.stats.pet_milestone_ores_mined || 0).toLocaleString()}**`;
                skillContext = true;
            }

            break;
        case "foraging":
            let logsMined = 0;

            if (!('collection' in profile.raw))
                break;

            for (const logCollection of keys(profile.raw.collection).filter(a => a.includes('LOG')))
                logsMined += profile.raw.collection[logCollection];

            output.description += `\n\nLogs collected: ${bold((logsMined || 0).toLocaleString())}`;
            skillContext = true;

            break;
        case "enchanting":
            if ('collection' in profile.raw) {
                output.description += `\n\nLapis Lazuli Collection: ${bold((profile.raw.collection['INK_SACK:4'] || 0).toLocaleString())}`;
                skillContext = true;
            }

            break;
    }

    const skillBonus = profile.data.skill_bonus[skillName];
    const bonusKeys = pickBy(skillBonus, value => value > 0);

    if (!skillContext)
        output.description += '\n';

    if (keys(bonusKeys).length > 0)
        output.description += '\nBonus: ';

    for (const [index, key] of keys(bonusKeys).entries()) {
        output.description += `+${bold(statModifier(skillBonus[key], key))} ${startCase(key.replace(/\_/g, ' '))}`;

        if (index < keys(bonusKeys).length - 1)
            output.description += ', ';
    }

    output.fields = [];

    if (skill.level < skill.maxLevel && skill.maxLevel >= 50) {
        let levelKeys;

        if (skill.maxLevel > 50) {
            levelKeys = keys(
                pickBy(xpMax, (value, key) => new Number(key) > skill.level)
            ).sort((a, b) => a - b);

            if (levelKeys.length > 3)
                levelKeys = [levelKeys[0], levelKeys[levelKeys.length - 3], levelKeys.pop()];
        } else {
            levelKeys = keys(
                pickBy(xpMax, (value, key) => new Number(key) > skill.level && new Number(key) <= 50)
            ).sort((a, b) => a - b);

            if (levelKeys.length > 3)
                levelKeys = [...levelKeys.slice(0, 2), levelKeys.pop()];
        }

        for (const key of levelKeys)
            output.fields.push({
                inline: true,
                name: `Level ${key}`,
                value: `in ${bold(Math.round(xpMax[key] - skill.xp).toLocaleString())} XP`
            });
    }

    return output;
};

export default {
    command: ['skills', 's'],
    argsRequired: 1,
    description: [
        "Check skills for a player.",
    ],
    example: [
        {
            run: "skills leaphant",
            result: "Returns skills for LeaPhant."
        }
    ],
    options: [
        ...helper.profileOptions,
        {
            name: 'skill',
            description: 'Show a specific skill',
            type: 3,
            choices: skillsSorted.map(s => {
                return {
                    name: capitalize(s),
                    value: s
                };
            })
        }
    ],
    usage: '<username> [profile name] [skill name]',
    call: async obj => {
        const { interaction, client } = obj;

        extendedLayout = obj.extendedLayout;

        let profile;

        try {
            profile = await helper.fetchProfile(interaction);
        } catch(e) {
            return;
        }

        const embed = {
            ...helper.profileEmbed(profile, 'Skills'),
            thumbnail: {
                url: `https://minotar.net/helm/${profile.data.uuid}/128`
            },
            description:
                `Total Skill XP: ${bold(numeral(profile.data.total_skill_xp).format('0.0a'))}\n`
                + `Average Skill Level: ${bold((Math.floor(profile.data.average_level * 100) / 100).toFixed(2))} `
                + `(${bold((Math.floor(profile.data.average_level_no_progress * 100) / 100).toFixed(2))}) `
                + `(#${bold(numeral(profile.data.average_level_rank).format('0[.]0a'))})`,
            fields: []
        };

        const buttons = [];
        const fields = [];

        for (const [index, skillName] of skillsSorted.entries()) {
            const skill = profile.data.levels[skillName];

            if (skill == null)
                continue;

            const name = upperFirst(skillName);
            const skillEmote = helper.emote('sb' + name, null, client);

            const field = {};

            if (extendedLayout)
                field['name'] = `${skillEmote.toString()} ${name} ${bold(skill.level)} (#${numeral(skill.rank).format('0[.]0a')})`;
            else
                field['name'] = bold(`${skillEmote.toString()} ${name} ${skill.level} (#${numeral(skill.rank).format('0[.]0a')})`);

            if (skill.level == skill.maxLevel)
                field['value'] = `${bold(skill.xpForNext === 0 ? '–' : numeral(skill.xpCurrent).format('0[.]0a'))} XP`;
            else
                field['value'] 
                = `${bold(skill.xpForNext === 0 ? '–' : numeral(skill.xpCurrent).format('0[.]0a'))} / `
                + `${skill.xpForNext === 0 ? '–' : numeral(skill.xpForNext).format('0[.]0a')} XP`;

            field['value'] += ` (${bold(numeral(skill.xp).format('0[.]0a'))})`;

            if (extendedLayout)
                field['name'] = `${bold(field['name'])}`;

            fields.push(field.name);

            if (extendedLayout)
                fields.push(field.value);
            else if (index > skillsSorted.length - 3)
                fields.push("⠀");

            buttons.push({
                customId: skillName,
                label: name,
                emoji: skillEmote,
                style: 'SECONDARY'
            })
        }

        buttons.forEach(b => b.type = 'BUTTON');

        const rows = [];
        const skillRow = {};

        for (let i = 0; i < buttons.length; i += 5) {
            const row = new MessageActionRow();

            const buttonRow = buttons.slice(i, i + 5);

            for (const button of buttonRow) {
                skillRow[button.customId] = i / 5;
            }

            row.setComponents(...buttonRow);
            rows.push(row);
        }

        for (let i = 0; i < fields.length; i += 2) {
            const field = {
                inline: true,
                name: fields[i],
                value: fields[i + 1]
            };

            if (embed.fields.length % 3 != 0)
                embed.fields.push({
                    inline: true,
                    name: "⠀",
                    value: "⠀"
                });

            embed.fields.push(field);
        }

        const customSkill = interaction.options.get('skill')?.value;

        let currentSkill = null;

        if (customSkill) {
            currentSkill = customSkill;

            await interaction.editReply({ embed: [skillEmbed(profile, customSkill, embed)], components: rows });
        } else {
            await interaction.editReply({ embeds: [embed], components: rows });
        }

        const reply = await interaction.fetchReply();

        const filter = i => i.user.id === interaction.user.id;
        const collector = reply.createMessageComponentCollector({ filter, idle: 120_000 });

        collector.on('collect', async i => {
            for (const row in rows)
                    for (const button in rows[row].components)
                        rows[row].components[button].setStyle('SECONDARY');

            if (i.customId == currentSkill) {
                currentSkill = null;

                return await i.update({ embeds: [embed], components: rows });
            }

            currentSkill = i.customId;

            const row = skillRow[currentSkill];
            const button = rows[row].components.findIndex(a => a.customId == currentSkill);

            rows[row].components[button].setStyle('PRIMARY');

            return await i.update({ embeds: [skillEmbed(profile, currentSkill, embed)], components: rows });
        });

        collector.on('end', async () => {
            const reply = await interaction.fetchReply();

            await interaction.editReply({ embeds: reply.embeds, components: [] });
        });
    }
};
