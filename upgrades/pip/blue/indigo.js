const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 1)**3.5) + 1111;
    },
    getDetails() {
        return {
            description: "blue pings are __20%__ stronger",
            name: "Indigo Vision",
            emoji: getEmoji('ponder_indigo', "💙"),
            flavor: "seeing an almost alternate reality.",
        }
    },
    getEffectString(level) {
        return `+${level*20}%`
    },
    getEffect(level, context) {
        return {
            blueStrength: (level*0.2),
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.beginning) return { showable: true, buyable: false, reason: "buy 'Eternity\'s Welcome'" };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 103 },
    type() { return PipUpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}