require('dotenv').config({ quiet: true });
const { REST, Routes } = require('discord.js');
const database = require('../helpers/database.js');
const fs = require('node:fs');
const path = require('node:path');

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error('variable in .env missing: DISCORD_TOKEN');

const clientId = process.env.DISCORD_CLIENT_ID;
if (!clientId) throw new Error('variable in .env missing: DISCORD_CLIENT_ID');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		
		await database.CachedCommand.destroy({ where: {} }); // clear old commands

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		for (const comm of data) {
			await database.CachedCommand.upsert({
				name: comm.name,
				id: comm.id,
			});
		}

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	} finally {
		await database.CachedCommand.sequelize.close();
		process.exit(0);
	}
})();