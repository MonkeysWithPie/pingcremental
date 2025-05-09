const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (5.5 ** currentLevel)) + 450;
    },
    getDetails() {
        return {
            description: "gain __^1.05__ pts",
            name: "Exponentiate",
            emoji: getEmoji('ponder_exponentiate', "**^**"),
            flavor: "they only way out is up.",
        }
    },
    getEffectString(level) {
        return `^${((level*0.05)+1).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            exponent: (level*0.05) + 1,
        }
    },
    upgradeRequirements() {
        return { sacrifice: 2 };
    },
    sortOrder() { return 3 },
    type() { return PipUpgradeTypes.BONUS }
}