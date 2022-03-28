import distance from 'jaro-winkler';
import fetch from 'node-fetch';

import config from './config.json';
import emotes from './emotes.json';

const sep = ' ✦ ';
const cmd_escape = "```";
const backtick = "`";

let db;

const PROFILE_NAMES = [
    "Apple",
    "Banana",
    "Blueberry",
    "Coconut",
    "Cucumber",
    "Grapes",
    "Kiwi",
    "Lemon",
    "Lime",
    "Mango",
    "Orange",
    "Papaya",
    "Peach",
    "Pear",
    "Pineapple",
    "Pomegranate",
    "Raspberry",
    "Strawberry",
    "Tomato",
    "Watermelon",
    "Zucchini"
];

const profileOptions = [
    {
        name: 'username',
        description: 'Player to retrieve data for',
        type: 3,
        required: true
    }, {
        name: 'profile',
        description: 'Profile to retrieve data for',
        type: 3,
        choices: PROFILE_NAMES.map(p => {
            return {
                name: p,
                value: p
            };
        })
    }
];

const module = {
    init: ( _db) => {
        db = _db;
    },

    sep: sep,

    cmd_escape: cmd_escape,

    profileOptions,

    mainColor: 0xdf73af,
    errorColor: 0xf04a4a,

    botName: config?.bot_name ?? 'Sky Flower',

    errorEmbed: e => {
        return {
            color: module.errorColor,
            author: {
                name: 'Error'
            },
            description: e.toString()
        }
    },

    extendedLayout: async interaction => {
        if (interaction.guildId == null)
            return true;

        const layout = await db.get(`layout_${interaction.guildId}_${interaction.channelId}`) || 'basic';

        return layout == 'extended';
    },

    prefix: async guild => {
        if (guild == null)
            return config.prefix;

        return (await db.get(`pfx_${guild.id}`)) || config.prefix;
    },

    log: (...params) => {
        console.log(`[${new Date().toISOString()}]`, ...params);
    },

    error: (...params) => {
        console.error(`[${new Date().toISOString()}]`, ...params);
    },

    getBazaarProduct: (query, products) => {
        let resultMatch;
        let itemResults = [];

        for (const key in products)
            itemResults.push({ ...products[key] });

        for (const product of itemResults) {
            if (product.name.toLowerCase() == query)
                return product;

            product.tagMatches = 0;

            for (const part of query.split(" "))
                for (const tag of product.tag)
                    if (tag == part)
                        product.tagMatches++;
        }

        itemResults = itemResults.sort((a, b) => b.tagMatches - a.tagMatches);
        itemResults = itemResults.filter(a => a.tagMatches == itemResults[0].tagMatches);

        if (itemResults.length == 1)
            return itemResults[0];

        itemResults.forEach(a => a.distance = distance(a.name, query, { caseSensitive: false }));
        itemResults = itemResults.sort((a, b) => b.distance - a.distance);

        return itemResults[0];
    },

    getLeaderboard: (query, leaderboards, amount = 1) => {
        let resultMatch;
        let lbResults = [];

        const exactMatch = leaderboards.find(a => a.key == query);

        if (exactMatch && amount == 1) {
            return exactMatch;
        }

        for (const lb of leaderboards)
            lbResults.push({ ...lb });

        for (const lb of lbResults) {
            if (lb.name.toLowerCase() == query)
                return amount == 1 ? lb : [lb];

            lb.tagMatches = 0;

            for (const queryPart of query.toLowerCase().split(" "))
                for (const namePart of lb.name.toLowerCase().split(" "))
                    if (namePart == queryPart)
                        lb.tagMatches++;
        }

        lbResults = lbResults.sort((a, b) => b.tagMatches - a.tagMatches);
        lbResults = lbResults.filter(a => a.tagMatches == lbResults[0].tagMatches);

        if (lbResults.length == 1)
            return amount == 1 ? lbResults[0] : lbResults;

        lbResults.forEach(a => a.distance = distance(a.name, query, { caseSensitive: false }));
        lbResults = lbResults.sort((a, b) => b.distance - a.distance);

        return amount == 1 ? lbResults[0] : lbResults.slice(0, amount);
    },

    /*commandHelp: async (commandName, prefix) => {
        if (Array.isArray(commandName))
            commandName = commandName[0];

        for (let i = 0; i < commands.length; i++) {
            let command = commands[i];

            if (!Array.isArray(command.command))
                command.command = [command.command];

            if (command.command.includes(commandName)) {
                let embed = {
                    fields: []
                };

                let commandsValue = "";
                const commandsName = "Aliases";

                command.command.forEach((_command, index) => {
                    if (index > 0)
                        commandsValue += ", ";

                    commandsValue += `\`${prefix}${_command}\``;
                });

                embed.fields.push({
                    name: commandsName,
                    value: commandsValue + "\n"
                });

                if (!Array.isArray(command.description))
                    command.description = [command.description];

                if (command.description) {
                    embed.fields.push({
                        name: "Description",
                        value: command.description.join("\n") + "\n"
                    })
                }

                if (command.usage) {
                    embed.fields.push({
                        name: "Usage",
                        value: `${backtick}${prefix}${command.command[0]} ${command.usage}${backtick}\n`
                    });
                }

                if (command.example) {
                    let examples = command.example;

                    if (!Array.isArray(examples))
                        examples = [examples];

                    let examplesValue = "";
                    let examplesName = "Example";

                    if (examples.length > 1)
                        examplesName += "s";

                    examples.forEach((example, index) => {
                        if (index > 0)
                            examplesValue += "\n";

                        if (example.result != null) {
                            examplesValue += `${backtick}${prefix}${example.run}${backtick}: `;
                            examplesValue += example.result;
                        } else {
                            examplesValue += `${backtick}${prefix}${example}${backtick}`;
                        }
                    });

                    embed.fields.push({
                        name: examplesName,
                        value: examplesValue + "\n"
                    })
                }

                return { embed: embed };
            }
        }

        return "Couldn't find command.";
    },*/

    emote: (emoteName, guild, client) => {
        if (emoteName in emotes)
            return client.emojis.cache.get(emotes[emoteName].id);

        let emote;

        if (guild)
            emote = guild.emojis.cache.find(emoji => emoji.name.toLowerCase() === emoteName.toLowerCase());

        if (!emote)
            emote = client.emojis.cache.find(emoji => emoji.name.toLowerCase() === emoteName.toLowerCase());

        return emote;
    },

    apiRequest: (path, params) => {
        const url = new URL(`${config.sky_api_base}${path}`);
        url.searchParams.append('key', config.credentials.sky_api_key);

        for (const param in params) {
            url.searchParams.append(param, params[param])
        }

        return fetch(url);
    },

    fetchProfile: async interaction => {
        const username = interaction.options.get('username')?.value;

        if (username === undefined) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [module.errorEmbed('No username specified.')]
            });
        }

        await interaction.deferReply();

        const response = await module.apiRequest(`/api/v2/profile/${username}`);

        if (!response.ok) {
            await interaction.editReply({
                ephemeral: true,
                embeds: [module.errorEmbed('Failed fetching profile.')]
            });

            throw 'Failed fetching profile';
        }

        const data = await response.json();

        if (data.error !== undefined) {
            await interaction.editReply({
                ephemeral: true,
                embeds: [module.errorEmbed(data.error)]
            });

            throw data.error;
        }

        let profile = Object.values(data.profiles).find(a => a.current);
        const customProfile = interaction.options.get('profile')?.value.toLowerCase();

        if (customProfile !== undefined) {
            for (const key in data.profiles) {
                if (data.profiles[key].cute_name.toLowerCase() == customProfile) {
                    profile = data.profiles[key];
                    break;
                }
            }
        }

        return profile;
    },

    profileEmbed: (profile, title) => {
        let name = profile.data.display_name;

        if (title != null) {
            name += "'";

            if (!profile.data.display_name.toLowerCase().endsWith('s'))
                name += 's';

            name += ` ${title}`;
        }

        let gamemodeIcon = '';

        if (profile.game_mode == 'ironman')
            gamemodeIcon = '♲ ';
        else if (profile.game_mode == 'bingo')
            gamemodeIcon = 'Ⓑ ';

        name += ` (${gamemodeIcon}${profile.cute_name})`

        return {
            color: module.mainColor,
            author: {
                icon_url: `https://minotar.net/helm/${profile.data.uuid}/64`,
                name,
                url: `https://sky.lea.moe/stats/${profile.data.uuid}/${profile.data.profile.profile_id}`,
            },
        };
    }

    
};

export default module;
