const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const modelsPath = path.join(__dirname, '../models');
const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));
const database = {}; // list of all models

for (const file of modelFiles) {
	const filePath = path.join(modelsPath, file);
	database[file.replace('.js','')] = require(filePath)(sequelize);
}

database.Player.hasMany(database.PlayerStat, { as: 'rawStats' });

database.sequelize = sequelize;

module.exports = database