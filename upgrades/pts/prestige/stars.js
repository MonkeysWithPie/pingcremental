const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const formatNumber = require('../../../helpers/formatNumber.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 250) return Math.round((currentLevel+1)**(4.2 * currentLevel/250));

        return Math.round((currentLevel+1)**4.2);
    },
    getDetails() {
        return {
            description: "gain `bp`",
            name: "beyond the stars",
            emoji: getEmoji('upgrade_stars', "💫"),
        }
    },
    getEffectString(level) {
        return `${formatNumber(level*4, true, 3)} bp`
    },
    getEffect(level, context) {
        if (context.state !== PingCalculationStates.POST_SCORING) return {};

        return {
            bp: level * 4,
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.pingularity) return { showable: false };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 1001 },
    type() { return UpgradeTypes.PRESTIGE },
    section() { return PingCalculationStates.POST_SCORING; }
}