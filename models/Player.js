const { DataTypes, Model } = require('sequelize');
const { getBadgesByName } = require('../helpers/badgeUtils.js');
const { PrestigeLayers } = require('../helpers/commonEnums.js');
const PlayerStat = require('./PlayerStat.js');

module.exports = (sequelize) => {
	class User extends Model {
		async getUserDisplay(client) {
			const user = await client.users.fetch(this.userId);
			let display = user ? user.username : this.userId;
			display = display.replaceAll("_", "\\_")

			// badges display
			if (this.displayedBadges.length > 0) {
				const badges = getBadgesByName(...this.displayedBadges);

				display += ' ' + badges.map(badge => badge.emoji).join('');
			}

			return display;
		}
		async stats() {
			const stats = await this.getRawStats();
			for (const layer of PrestigeLayers) {
				stats[layer] = stats.find(stat => stat.layer === layer) || null;
			}

			for (const layer of PrestigeLayers) {
				if (!stats[layer]) {
					let newStat = stats.total.get({ plain: true });
					delete newStat.id;
					newStat.layer = layer;
					newStat = await PlayerStat(sequelize).create(newStat);
					stats[layer] = newStat;
					await this.addRawStat(newStat);
				}
			}

			return stats;
		}
		async increaseStat(key, count = 1) {
			if (count < 0) return;
			await this.stats(); // refresh layers in case one is missing

			const stats = await this.getRawStats();
			for (const stat of stats) {
				stat[key] += count;
				await stat.save();
			}
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
		
		apt: {
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

		badges: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '',
			get() {
				return this.getDataValue('badges')
					.split(',')
					.filter(x => x !== '');
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
				return this.getDataValue('displayedBadges')
					.split(',')
					.filter(x => x !== '');
			},
			set(value) {
				this.setDataValue('displayedBadges', value.join(','));
			}
		},

		settings: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
		},
		formatSettings: {
			type: DataTypes.VIRTUAL,
			get() {
				return {
					formatMode: this.settings.formatMode || 'standard',
					swapCommas: this.settings.swapCommas || false,
				}
			},
			set() {
				throw new Error('formatSettings is virtual and shouldn\'t be set directly');
			}
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
		eternities: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		
		// fabric data
		tears: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		thread: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		shopSeed: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'TUTORIAL',
		},
		shopEmptySlots: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '',
			get() {
				return this.getDataValue('shopEmptySlots')
					.split(',')
					.filter(x => x !== '')
					.map(x => parseInt(x));
			},
			set(value) {
				this.setDataValue('shopEmptySlots', value.join(','));
			}
		},
		shopRerolls: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cloakModificationsAllowed: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},

		// note: fabric data isn't stored by level, it's stored by count owned
		ownedFabrics: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
		},
		equippedFabrics: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
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
		},

		// TODO: move the below stats to PlayerStat.js
		// see also: https://sequelize.org/docs/v6/advanced-association-concepts/creating-with-associations/#belongsto--hasmany--hasone-association		

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
		totalAptClicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

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
		bluePingRate: {
			type: DataTypes.VIRTUAL,
			get() {
				if (this.bluePings + this.bluePingsMissed === 0) return undefined;
				return Math.round((this.bluePings / (this.bluePings + this.bluePingsMissed)) * 10000) / 100;
			},
			set() {
				throw new Error('bluePingRate is virtual and shouldn\'t be set directly');
			}
		},
		bluePingMissRate: {
			type: DataTypes.VIRTUAL,
			get() {
				if (this.bluePings + this.bluePingsMissed === 0) return undefined;
				return Math.round((this.bluePingsMissed / (this.bluePings + this.bluePingsMissed)) * 10000) / 100;
			},
			set() {
				throw new Error('bluePingMissRate is virtual and shouldn\'t be set directly');
			}
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
		

		totalPip: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		totalEternities: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		totalTears: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		totalThread: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		// upgrade effect records
		// note: cannot be set with autopings
		highestArtisanCombo: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		highestOrchestraCombo: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		highestCoinflipCount: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		highestPigScore: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		sequelize,
		timestamps: true,
		modelName: 'User',

		defaultScope: {
			include: 'rawStats',
		}
	})

	return User;
};