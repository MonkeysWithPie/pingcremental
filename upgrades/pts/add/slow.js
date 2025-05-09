const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (1.5**(currentLevel)))
    },
    getDetails() {
        return {
            description: "each ping gives __+1__ pt",
            name: "slow internet",
            emoji: getEmoji('upgrade_slow', "🕓"),
        }
    },
    getEffectString(level) {
        return `+${level} pt${level === 1 ? "" : "s"}`
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
    type() { return UpgradeTypes.ADD_BONUS }
}