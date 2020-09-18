# Sky Flower <img align="right" width="100" height="100" src="resources/icon_transparent.png">
Open-source Discord bot with cool SkyBlock features. 🌺

<img src="https://i.imgur.com/729g1KQ.png"></img>

You can either add the public instance (<a href="https://discord.com/oauth2/authorize?client_id=747232589961625665&scope=bot&permissions=1073750016">Invite Link</a>) to your server or run the bot yourself.

<h3>Commands</h3>

**Default Prefix**: `s!`

`s!help` - Show list of commands.

`s!info` - Show info and links for this bot.

`s!bazaar [amount] <item>` – Get bazaar prices for an item.

`s!skills <user> [profile] [skill]` – Get skill levels of a player.

`s!leaderboard [leaderboard] [u:username] [r:rank]` – Show leaderboards.

`s!calendar [event]` – Show SkyBlock calendar or times for specific events.

<h3>Admin Commands</h3>

`s!skyflowerprefix <prefix>` - Set prefix for this bot (always prefixed with `s!`).

`s!togglelayout <channel id>` - Set a channel to toggle extended layout for.

*Run a command without arguments for extended help.*

`< >` = required argument – `[ ]` = optional argument

<h3>Prerequisites</h3>

- <a href="https://nodejs.org/">Node.js</a>
- <a href="https://redis.io/">Redis</a>

<h3>Installation</h3>

Clone the project and and run `npm i` to install the dependencies.

Now open `config.json` and enter a valid Discord bot token which you can obtain <a href="https://discord.com/developers/applications/">Here</a>. Next you should run `node upload-emojis` to initiate the process for uploading the emojis the bot uses (you might want to create a dedicated emote server for this).

You can now run `npm start` to start the bot. Invite the instance to your server by finding the bot's Client ID in your Discord developer console and pasting it into this Link: `https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=1073750016`.
