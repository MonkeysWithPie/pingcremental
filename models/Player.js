const { Sequelize, DataTypes, Model } = require('sequelize');
const { getEmoji } = require('./../helpers/emojis.js');

module.exports = (sequelize) => {
	class User extends Model {
		async getUserDisplay(client, database) {
			const user = await client.users.cache.get(this.userId);
			let display = user ? user.username : this.userId;

			// badges display
			if (this.displayedBadges.length > 0) {
				const badges = await database.Badge.findAll({
					where: {
						dbId: this.displayedBadges,
					}
				});
				display += ' ' + badges.map(badge => getEmoji(badge.emoji)).join('');
			}

			return display;
		}
	}

	User.init({
		userId: {
			type: DataTypes.STRING,
			primaryKey: true,
		},

		score: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		clicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		upgrades: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
		},

		totalScore: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		highestScore: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		totalClicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		badges: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '',
			get() {
				return this.getDataValue('badges').split(',');
			},
			set(value) {
				this.setDataValue('badges', value.join(','));
			}
		},
		displayedBadges: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '',
			get() {
				return this.getDataValue('displayedBadges').split(',');
			},
			set(value) {
				this.setDataValue('displayedBadges', value.join(','));
			}
		},

		// misc stats (move to separate table?)
		bluePings: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		bluePingsMissed: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		luckyPings: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		highestBlueStreak: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		removedUpgrades: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		

		// prestige data
		bp: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		prestigeUpgrades: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
		},
		pip: { // short for Potential (for) Increased Pts
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		// slumber upgrade
		lastPing: {
			type: DataTypes.DATE,
			defaultValue: Date.now(),
			allowNull: false,
		},
		slumberClicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		// glimmer upgrade
		glimmerClicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		}

	}, {
		sequelize,
		timestamps: true,
		modelName: 'User',
	})

	return User;
};