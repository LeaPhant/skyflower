import Command from '../command.js';

import { bold, time } from '@discordjs/builders';
import helper from '../helper.js';

const HOUR_MS = 50_000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_LENGTH = 31;

const MONTH_MS = MONTH_LENGTH * DAY_MS;
const YEAR_MS = 12 * MONTH_MS;

const JERRY_CYCLE = [
    "???",
    "???",
    "???",
    "???",
    "???",
    "???",
    "???",
];

const JERRY_START = 1653232500_000;
const JERRY_DURATION = 6 * 3600 * 1000;
const JERRY_END = JERRY_START + YEAR_MS;

const JERRY_TIMES = [];

let currentTime = JERRY_START;
let i = 0;

while (currentTime < JERRY_END) {
    JERRY_TIMES.push({
        start: JERRY_START + i * JERRY_DURATION,
        end: JERRY_START + (i + 1) * JERRY_DURATION - 1,
        mayor: JERRY_CYCLE[i % 7]
    });

    i++;

    currentTime += JERRY_DURATION;
}

class JerryCommand extends Command {
    command = 'jerry';
    description = "Check Perkpocalypse Calendar.";
    options = [
        {
            name: 'mayor',
            description: 'Filter result to a specific mayor',
            type: 3,
            choices: [
                {
                    name: 'Aatrox',
                    value: 'Aatrox',
                    type: 3
                },
                {
                    name: 'Barry',
                    value: 'Barry',
                    type: 3
                },
                {
                    name: 'Cole',
                    value: 'Cole',
                    type: 3
                },
                {
                    name: 'Diana',
                    value: 'Diana',
                    type: 3
                },
                {
                    name: 'Diaz',
                    value: 'Diaz',
                    type: 3
                },
                {
                    name: 'Marina',
                    value: 'Marina',
                    type: 3
                },
                {
                    name: 'Paul',
                    value: 'Paul',
                    type: 3
                },
            ]
        }
    ];

    async call(obj) {
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
            currentMayorValue = `${mayor.mayor} – ends ${time(new Date(mayor.end), 'R')}`;
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

            nextMayorsValue += `${nextMayors[i].mayor} – starts ${time(new Date(nextMayors[i].start), 'R')}`;
        }

        embed.footer.text = `${cyclesLeft} Mayor terms left`;

        embed.fields.push({
            name: 'Next Mayors',
            value: nextMayorsValue,
        });

        await interaction.reply({ embeds: [embed] });
    }
};

export default JerryCommand;
