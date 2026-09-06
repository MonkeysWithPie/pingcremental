const { DataTypes, Model } = require('sequelize');
const { getBadgesByName } = require('../helpers/badgeUtils.js');
const { PrestigeLayers } = require('../helpers/commonEnums.js');

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
			await this.refreshStats();
			const stats = await this.getRawStat();
			for (const layer of PrestigeLayers) {
				stats[layer] = stats.find(stat => stat.layer === layer) || null;
			}

			return stats;
		}
		statsSync() {
			const stats = this.rawStat;
			for (const layer of PrestigeLayers) {
				stats[layer] = stats.find(stat => stat.layer === layer) || null;
			}
			return stats;
		}
		async refreshStats() {
			const stats = await this.getRawStat();
			if (stats.length === PrestigeLayers.length) return;

			let total = stats.find(stat => stat.layer === 'total');
			if (!total) {
				total = await this.createRawStat({ layer: 'total' });
			}

			for (const layer of PrestigeLayers) {
				if (!stats.find(stat => stat.layer === layer) && layer !== 'total') {
					const newStat = total.get({ plain: true });
					delete newStat.id;
					newStat.layer = layer;
					await this.createRawStat(newStat);
				}
			}
		}
		async layerReset(layer) {
			const stats = await this.getRawStat();
			const index = PrestigeLayers.indexOf(layer);

			for (let i = 0; i <= index; i++) {
				const layer = PrestigeLayers[i];
				const stat = stats.find(stat => stat.layer === layer);
				await this.createRawStat({ layer: stat.layer });
				await stat.destroy();
			}
		}
		increaseStat(key, count = 1) {
			if (count <= 0 || !count) return;
			this._pendingStatIncreases ??= {};
			this._pendingStatIncreases[key] = (this._pendingStatIncreases[key] || 0) + count;
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
			set(val) {
				this.increaseStat('score', val - this.getDataValue('score'));
				this.setDataValue('score', val);
			}
		},
		
		apt: {
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
					formatMode: this.settings.numberFormat || 'standard',
					swapCommas: this.settings.swapCommas === 'yes' || false,
				}
			},
			set() { return; }
		},

		consoleUnlocks: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '',
			get() {
				return this.getDataValue('consoleUnlocks').split(',').filter(x => x !== '');
			},
			set(value) {
				this.setDataValue('consoleUnlocks', value.join(','));
			}
		},

		// prestige data
		bp: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
			set(val) {
				this.increaseStat('bp', val - this.getDataValue('bp'));
				this.setDataValue('bp', val);
			}
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
			set(val) {
				this.increaseStat('pip', val - this.getDataValue('pip'));
				this.setDataValue('pip', val);
			}
		},
		eternities: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
			set(val) {
				this.increaseStat('eternities', val - this.getDataValue('eternities'));
				this.setDataValue('eternities', val);
			}
		},

		
		// fabric data
		tears: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
			set(val) {
				this.increaseStat('tears', val - this.getDataValue('tears'));
				this.setDataValue('tears', val);
			}
		},
		thread: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
			set(val) {
				this.increaseStat('thread', val - this.getDataValue('thread'));
				this.setDataValue('thread', val);
			}
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
	}, {
		sequelize,
		timestamps: true,
		modelName: 'User',

		defaultScope: {
			include: 'rawStat',
		}
	})

	User.addHook("afterSave", async (user, options) => {
		const pending = user._pendingStatIncreases;
		if (!pending) return;

		await user.refreshStats();
		const stats = await user.getRawStat({ transaction: options.transaction });
  		await Promise.all(stats.map(stat => stat.increment(pending, { transaction: options.transaction })));
 		user._pendingStatIncreases = null;
	})

	return User;
};