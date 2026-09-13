const database = require('./helpers/database');
const fs = require('fs');

async function run() {
	const force = process.argv.includes('--force') || process.argv.includes('-f');
	if (force && fs.existsSync('data/database.sqlite')) {
		console.log("careful! force sync will probably delete ALL data. an automatic backup has been created.");
		fs.copyFileSync('data/database.sqlite', `data/database-backup-${Date.now()}.sqlite`);
	}

	const sequelize = database.sequelize
	await sequelize.sync({ force });
	sequelize.close();
}

run()