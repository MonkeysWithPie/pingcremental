const { UpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1 : null;
    },
    getDetails() {
        return {
            description: "ping remains eternal.",
            name: "Eternity",
            emoji: getEmoji('upgrade_eternity', "🌌"),
        }
    },
    getEffectString(level) {
        return level === 1 ? "released" : `constrained`
    },
    getEffect(level, context) {
        return {} // nothing; effect is elsewhere
    },
    isBuyable(context) {
        return context.bp >= 10000;
    },
    sortOrder() { return 1003 },
    type() { return UpgradeTypes.PRESTIGE },
    section() { return 0; }
}