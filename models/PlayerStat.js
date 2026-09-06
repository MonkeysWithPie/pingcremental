const { Model, DataTypes } = require("sequelize");
const { PrestigeLayers } = require("../helpers/commonEnums");

module.exports = (sequelize) => {
    class UserStats extends Model {}

    UserStats.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        layer: {
            type: DataTypes.ENUM(PrestigeLayers)
        },

        legacyStat: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        score: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },

        highScore: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },

        clicks: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },

        aptClicks: {
            type: DataTypes.NUMBER,
            defaultValue: -1,
            set(val) {
                if (this.getDataValue('aptClicks') === -1 && val !== 0) {
                    val++;
                }
                this.setDataValue('aptClicks', val);
            }
        },

        bluePings: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        bluePingsMissed: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        blueStreak: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },


		bluePingClickRate: {
			type: DataTypes.VIRTUAL,
			get() {
				if (this.bluePings + this.bluePingsMissed === 0) return undefined;
				return this.bluePings / (this.bluePings + this.bluePingsMissed);
			},
			set() { return }
		},
		bluePingMissRate: {
			type: DataTypes.VIRTUAL,
			get() {
				if (this.bluePings + this.bluePingsMissed === 0) return undefined;
				return this.bluePingsMissed / (this.bluePings + this.bluePingsMissed);
			},
			set() { return }
		},
        bluePingAppearRate: {
            type: DataTypes.VIRTUAL,
            get() {
                const clicks = this.clicks + this.aptClicks;
                if (clicks === 0) return undefined;
                return this.bluePings / clicks;
            },
            set() { return }
        },

        luckyPings: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        
        bp: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        pip: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        eternities: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        removedUpgrades: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },

        tears: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        thread: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },

        artisanCombo: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        orchestraCombo: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        coinflipCount: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
        pigScore: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        },
    }, {
        sequelize,
        modelName: "UserStat",
        timestamps: false,
    })

    return UserStats;
}