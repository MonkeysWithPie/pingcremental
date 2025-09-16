const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (1.45**(currentLevel)));
    },
    getDetails() {
        return {
            description: "gain __x1.02__ `pts`",
            name: "fine, just have a multiplier",
            emoji: getEmoji('upgrade_multiplier', "X"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.02).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            multiply: 1+level*0.02,
        }
    },
    isBuyable(context) {
        return context.upgrades && context.upgrades.redshift;
    },
    sortOrder() { return 14 },
    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; }
}