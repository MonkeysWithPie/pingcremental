// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection } = require('discord.js');

require('dotenv').config({ quiet: true });

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error('variable in .env missing: DISCORD_TOKEN')

const ownerId = process.env.OWNER_ID;
if (!ownerId) console.warn('variable in .env missing: OWNER_ID, some functionality may not work correctly or be disabled');

const testing = process.env.BETA_TEST === 'true';
if (testing) {
	console.warn(`beta testing mode is enabled!! this means users will have 100 APT minimum to allow for testing faster!`)
}

const client = new Client({ intents: [] });
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(foldersPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARN] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Log in to Discord with your client's token
client.login(token);