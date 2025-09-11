# pingcremental

## about

pingcremental is a discord bot that is an incremental. (who would've thought?)
if you'd like to play yourself without self-hosting, [add the bot to your user](https://discord.com/oauth2/authorize?client_id=1360375772367290590).

## self-host setup

actually pretty simple; there's not a lot you need to do.

### downloading

1. click the green Code button on the repository's main page.
2. select your method of choice.
3. after setting up, ensure you have the correct packages installed by running `npm install`.

### .env

there are three fields that should be mostly self-explainatory. these fields will all be logged if not filled out.

1. `DISCORD_TOKEN` - the token for the bot

2. `DISCORD_CLIENT_ID` - the discord snowflake of the bot

3. `OWNER_ID` - the discord snowflake of the owner user of the bot. technically optional, but some functionality will be disabled or work incorrectly.

4. `TEST_ENV` - when set to "true", will enable special commands that **anyone can use to modify their profile freely**.

### running

there are two ways to do this.

#### 1. automatic

just run `run.bat`! it's that simple. it'll set everything up for you (commands, database, and the bot itself).

the bot will restart on its own upon encountering an error, or when using `/development restart`.

#### 2. manual

there are two things that need to be initialized before running the bot:

1. the database
2. the commands

to initalize the database, run `dbInit.js`. it'll sync the database, and create the file if necessary.

similarly, run `deploy.js` to send all your commands to discord.

to run the bot, simply run the `index.js` file. there are some flags for running:

1. `-d` or `--dev`

    this prevents the usage of /ping unless you are the owner.
    this additionally sets the ping to always be 5, in order to bypass the wait for `client.ws.ping` to update.

2. `-t` or `--timing`

    this logs the duration of segments when calculating ping. useful for optimization.

### go wild

now that you have the bot set up, do whatever you want!

it's worth noting that your bot's data **will not** sync with the global bots'.
this means you can cheat in pts and things to your heart's content!
happy developing.
