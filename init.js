const fs = require('fs');

const configDefault = {
    "credentials": {
        "bot_token": "",
        "discord_client_id": "",
        "sky_api_key": ""
    },
    "sky_api_base": "https://sky.lea.moe",
    "debug": false,
    "prefix": "s!",
    "dbUri": "redis://localhost:6379",
    "dbNamespace": "skyflower"
};

const emotesDefault = {};

if(!fs.existsSync('./config.json'))
    fs.writeFileSync('./config.json', JSON.stringify(configDefault, null, 4));

if(!fs.existsSync('./emotes.json'))
    fs.writeFileSync('./emotes.json', JSON.stringify(emotesDefault, null, 4));