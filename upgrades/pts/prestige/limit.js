const { UpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const formatNumber = require('../../../helpers/formatNumber.js');

module.exports = {
    getPrice(currentLevel) {
        return 123456 * (currentLevel+1)**3;
    },
    getDetails() {
        return {
            description: "increase \`bp\` storage",
            name: "beyond the limit",
            emoji: getEmoji('upgrade_limit', "🔏"),
        }
    },
    getEffectString(level) {
        return `${formatNumber((level+1)*10000, true, 3)} storage`;
    },
    getEffect(level, context) {
        return {} // nothing; effect is elsewhere
    },
    unlockRequirements(context) {
        if (!context.upgrades.pingularity) return { showable: false };
        if (!context.upgrades.stars) return { showable: true, buyable: false, reason: "buy 'beyond the stars'" };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 1002 },
    type() { return UpgradeTypes.PRESTIGE },
    section() { return 0; }
}