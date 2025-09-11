const { PipUpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(357 * (1.75 ** currentLevel)) + 1000;
    },
    getDetails() {
        return {
            description: "increase your max bp by __x1.2__",
            name: "Stellar Strength",
            emoji: getEmoji('ponder_storage', "🪐"),
            flavor: "carry the weight of the stars.",
        }
    },
    getEffectString(level) {
        return `x${((level * 0.2) + 1).toFixed(2)}`;
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 401 },
    type() { return PipUpgradeTypes.PRESTIGE },
    section() { return 0; }
}