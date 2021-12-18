const HOUR_MS = 50_000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_LENGTH = 31;

const MONTH_MS = MONTH_LENGTH * DAY_MS;
const YEAR_MS = 12 * MONTH_MS;

const JERRY_CYCLE = [
    "Paul",
    "Cole",
    "Diaz",
    "Barry",
    "Aatrox",
    "Diana",
    "Marina"
];

const JERRY_START = 1631805300_000;
const JERRY_DURATION = 6 * 3600 * 1000;
const JERRY_END = JERRY_START + YEAR_MS;

const JERRY_TIMES = [];

let time = JERRY_START;
let i = 0;

while (time < JERRY_END) {
    JERRY_TIMES.push({
        start: JERRY_START + i * JERRY_DURATION,
        end: JERRY_START + (i + 1) * JERRY_DURATION - 1,
        mayor: JERRY_CYCLE[i % 7]
    });

    i++;

    time += JERRY_DURATION;
}

import helper from '../helper.js';

export default {
    command: ['jerry'],
    description: [
        "Check Perkpocalypse Calendar.",
    ],
    options: [
        {
            name: 'mayor',
            description: 'Filter result to a specific mayor',
            type: 3
        }
    ],
    usage: '',
    call: async obj => {
        const { interaction } = obj;

        let embed = {
            color: helper.mainColor,
            fields: [],
            author: {
                name: 'Jerry Perkpocalypse Calendar'
            },
            footer: {}
        };

        const currentMayorIndex = JERRY_TIMES.findIndex(a => Date.now() >= a.start && Date.now() < a.end);
        let currentMayorValue = 'None';

        if (currentMayorIndex > -1) {
            const mayor = JERRY_TIMES[currentMayorIndex];
            currentMayorValue = `${mayor.mayor} – ends <t:${Math.floor(mayor.end / 1000)}:R>`;
        }

        embed.fields.push({
            name: 'Current Mayor',
            value: currentMayorValue
        });

        let nextMayors = JERRY_TIMES.filter(a => a.start > Date.now());

        const cyclesLeft = nextMayors.length;

        const filterMayor = interaction.options.get('mayor')?.value;

        if (filterMayor)
            nextMayors = nextMayors.filter(a => a.mayor.toLowerCase() == filterMayor.toLowerCase());

        let nextMayorsValue = nextMayors.length > 0 ? '' : 'None';

        for (let i = 0; i < 3; i++) {
            if (i > nextMayors.length - 1)
                break;

            if (i > 0)
                nextMayorsValue += '\n';

            nextMayorsValue += `${nextMayors[i].mayor} – starts <t:${Math.floor(nextMayors[i].start / 1000)}:R>`
        }

        embed.footer.text = `${cyclesLeft} Mayor terms left`;

        embed.fields.push({
            name: 'Next Mayors',
            value: nextMayorsValue,
        });

        await interaction.reply({ embeds: [embed] });
    }
};
