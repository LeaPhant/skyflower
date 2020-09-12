const MONTHS = [
    "Early Spring", "Spring", "Late Spring",
    "Early Summer", "Summer", "Late Summer",
    "Early Autumn", "Autumn", "Late Autumn",
    "Early Winter", "Winter", "Late Winter"
];

const HOUR_MS = 50_000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_LENGTH = 31;
const YEAR_LENGTH = MONTHS.length;

const MONTH_MS = MONTH_LENGTH * DAY_MS;
const YEAR_MS = YEAR_LENGTH * MONTH_MS;

const YEAR_0 = 1560275700_000;

const DURATION_FORMAT = function(){
    return this.duration.asSeconds() >= 60 ? "d [days, ]h [hours, ]m [minutes]" : "s [seconds]";
};

const ZOO_START = YEAR_0 + YEAR_MS * 66;
const ZOO_CYCLE_MS = YEAR_MS / 2;
const ZOO_CYCLE = [
    "ELEPHANT",
    "GIRAFFE",
    "BLUE_WHALE",
    "TIGER",
    "LION",
    "MONKEY"
];

const getOffset = (month, day) => {
    return MONTHS.indexOf(month) * MONTH_LENGTH * DAY_MS 
    + (day - 1) * DAY_MS;
}

const getZooPet = time => {
    const iterations = Math.floor((time - ZOO_START) / ZOO_CYCLE_MS);

    return ZOO_CYCLE[iterations % ZOO_CYCLE.length];
}

const nth = n => n + ['st','nd','rd'][((n + 90) % 100 - 10) % 10 - 1] || n + 'th';

const EVENTS = [
    {
        name: 'Traveling Zoo',
        emoji: '🐘',
        times: [
            [getOffset('Early Summer', 1), getOffset('Early Summer', 3)],
            [getOffset('Early Winter', 1), getOffset('Early Winter', 3)]
        ]
    },
    {
        name: 'Fear Mongerer',
        emoji: '👹',
        times: [
            [getOffset('Autumn', 26), getOffset('Late Autumn', 3)]
        ]
    },
    {
        name: 'Spooky Festival',
        emoji: '🎃',
        times: [
            [getOffset('Autumn', 29), getOffset('Autumn', 31)]
        ]
    },
    {
        name: 'Season of Jerry',
        emoji: '🎁',
        times: [
            [getOffset('Late Winter', 24), getOffset('Late Winter', 26)]
        ]
    },
    {
        name: 'Jerry Workshop',
        emoji: '🎣',
        times: [
            [getOffset('Late Winter', 1), getOffset('Late Winter', 31)]
        ]
    },
    {
        name: 'New Year Celebration',
        emoji: '❄️',
        times: [
            [getOffset('Late Winter', 29), getOffset('Late Winter', 31)]
        ]
    }
];

const FISHING_FESTIVAL = {
    name: 'Fishing Festival',
    emoji: '🦈',
    years: [90],
    times: []
};

for(const month of MONTHS)
    FISHING_FESTIVAL.times.push(
        [getOffset(month, 1), getOffset(month, 3)]
    );

EVENTS.push(FISHING_FESTIVAL);

const helper = require('../helper');
const _ = require('lodash');

const moment = require('moment');
require('moment-duration-format');

module.exports = {
    command: ['calendar', 'cal'],
    description: [
        "Check SkyBlock Calendar.",
    ],
    usage: '',
    call: async obj => {
        const { client, prefix, argv, extendedLayout } = obj;

        let embed = {
            color: helper.mainColor,
            fields: [],
            author: {
                name: 'SkyBlock Calendar'
            }
        };

        const currentYear = Math.floor((Date.now() - YEAR_0) / YEAR_MS);
        const currentOffset = (Date.now() - YEAR_0) % YEAR_MS;

        embed.footer = {
            text: `SkyBlock Year ${currentYear + 1}${helper.sep}${prefix}cal [event]`
        };

        const currentMonth = Math.floor(currentOffset / MONTH_MS);
        const currentMonthOffset = (currentOffset - currentMonth * MONTH_MS) % MONTH_MS;

        const currentDay = Math.floor(currentMonthOffset / DAY_MS);
        const currentDayOffset = (currentMonthOffset - currentDay * DAY_MS) % DAY_MS;

        let suffix = 'am';
        let currentHour = Math.floor(currentDayOffset / HOUR_MS);
        let currentMinute = Math.floor((currentDayOffset - currentHour * HOUR_MS) / HOUR_MS * 60);

        if(currentHour >= 12)
            suffix = 'pm';

        if(currentHour > 12)
            currentHour -= 12;

        if(currentHour == 0)
            currentHour = 12;

        const formattedTime = `${currentHour}:${(Math.floor(currentMinute / 10) * 10).toString().padStart(2, '0')}${suffix}`;

        let nextEvents = [];

        for(let i = 0; i < 4; i++){
            for(const event of EVENTS){
                for(const _time of event.times){
                    const time = [_time[0] + YEAR_MS * i, _time[1] + YEAR_MS * i];

                    const offset = currentOffset;

                    let year = Math.floor((currentYear * YEAR_MS + offset) / YEAR_MS) + 1;

                    if(time[1] < offset)
                        year++;

                    if(Array.isArray(event.years) && !event.years.includes(year))
                        continue;

                    const msTill = 
                    time[1] < offset ? YEAR_MS - offset + time[0] // event is next year
                    : time[0] - offset; // event is in current year

                    const duration = time[1] - time[0] + DAY_MS;

                    let { emoji } = event;

                    if(event.name == 'Traveling Zoo')
                        emoji = helper.emote(getZooPet(Date.now() + msTill), null, client);
                    
                    nextEvents.push({
                        name: event.name,
                        emoji,
                        start: msTill,
                        duration,
                        end: msTill + duration
                    });
                }
            }
        }

        nextEvents = nextEvents.sort((a, b) => a.start - b.start);
        nextEvents = _.uniqBy(nextEvents, 'start');

        let currentEvents = [];

        for(const event of nextEvents.filter(a => a.start < 0))
            currentEvents.push(nextEvents.shift());

        if(nextEvents[0].start < 0)
            currentEvent = nextEvents.shift();

        embed.fields.push({
            name: 'Date',
            value: `${MONTHS[currentMonth]} **${nth(currentDay + 1)}**`,
            inline: true
        });

        embed.fields.push({
            name: 'Time',
            value: formattedTime,
            inline: true
        });

        embed.fields.push({
            name: 'Next Month',
            value: `in **${moment.duration(MONTH_MS - currentMonthOffset).format(DURATION_FORMAT, { trim: 'both' })}**`,
            inline: true
        });

        if(currentEvents.length > 0){
            let currentEventsText = '';

            for(const [index, event] of currentEvents.entries()){
                if(index > 0)
                    currentEventsText += '\n';
    
                currentEventsText += `${event.emoji} ${event.name} – ends in ${
                    moment.duration(event.duration + event.start).format(DURATION_FORMAT, { trim: 'both' })
                }`;
            }

            embed.fields.push({
                name: 'Current Events',
                value: currentEventsText
            });
        }

        let nextEventsName = 'Next Events';

        if(argv.length > 1){
            let nextEventsFiltered = [];
            let eventSearch = argv.slice(1);

            for(const search of eventSearch)
                nextEventsFiltered = nextEvents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

            if(nextEventsFiltered.length > 0){
                nextEvents = nextEventsFiltered.filter(a => a.name == nextEventsFiltered[0].name);

                embed.fields.push({
                    name: nextEvents[0].name,
                    value: `Duration: **${moment.duration(nextEvents[0].duration).format(DURATION_FORMAT, { trim: 'both' })}**`
                });
            }
        }

        let nextEventsText = '';

        for(const [index, event] of nextEvents.slice(0, extendedLayout ? 8 : 4).entries()){
            if(index > 0)
                nextEventsText += '\n';

            nextEventsText += `${event.emoji} ${event.name} – starts in ${
                moment.duration(event.start).format(DURATION_FORMAT, { trim: 'both' })
            }`;
        }

        embed.fields.push({
            name: nextEventsName,
            value: nextEventsText
        });

        if(nextEventsName != 'Next Events')
            embed.fields.push({
                name: nextEventsName,
                value: nextEventsText
            });

        return { embed };
    }
};