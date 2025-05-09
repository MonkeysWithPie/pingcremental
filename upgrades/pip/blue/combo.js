const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(103 * (currentLevel)**4) + 1234;
    },
    getDetails() {
        return {
            description: "gain __1.15x__ pts for each blue ping in the current combo",
            name: "Chain Combo",
            emoji: getEmoji('ponder_combo', "🔗"),
            flavor: "a rare coincidence twisted to an incredible feat.",
        }
    },
    getEffectString(level) {
        return `x${((0.15 * level)+1).toFixed(2)}`
    },
    getEffect(level, context) {
        if (context.specials.blueCombo-1 > 0) return {
            multiplier: (1.15 * level * (context.specials.blueCombo - 1)),
        }
        return {}
    },
    upgradeRequirements() {
        return { indigo: 4 };
    },
    sortOrder() { return 105 },
    type() { return PipUpgradeTypes.BLUE_PING }
}