const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (1.15**(currentLevel)))
    },
    getDetails() {
        return {
            description: "each ping gives __+1__ `pts`",
            name: "slow internet",
            emoji: getEmoji('upgrade_slow', "🕓"),
        }
    },
    getEffectString(level) {
        return `+${level} \`pts\``
    },
    getEffect(level, context) {
        return {
            add: level
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 1 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}