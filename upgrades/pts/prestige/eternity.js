const { UpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const formatNumber = require('../../../helpers/formatNumber.js');

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
    unlockRequirements(context) {
        if (!context.upgrades.pingularity) return { showable: false };
        if (context.bp < 10000) return { showable: true, buyable: false, reason: `${formatNumber(context.bp)}/10,000 bp` };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 1003 },
    type() { return UpgradeTypes.PRESTIGE },
    section() { return 0; }
}