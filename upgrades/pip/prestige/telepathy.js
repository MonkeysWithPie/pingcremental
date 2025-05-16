const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(2500 * (3.5**currentLevel));
    },
    getDetails() {
        return {
            description: "gain __x1.2__ PIP",
            name: "Telepathy",
            emoji: getEmoji('ponder_telepathy', "🧠"),
            flavor: "know your thoughts before you even think them.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.2) + 1).toFixed(1)}`
    },
    getEffect(level, context) {
        return {
            special: {
                "pip": ((level ? level : 0)*0.2) + 1,
            },
        }
    },
    upgradeRequirements() {
        return { storage: 2 };
    },
    sortOrder() { return 403 },
    type() { return PipUpgradeTypes.PRESTIGE }
}