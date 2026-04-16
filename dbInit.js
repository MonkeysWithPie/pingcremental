const database = require('./helpers/database');

async function run() {
	const sequelize = database.sequelize
	await sequelize.sync({ alter: true });
	sequelize.close();
}

run()