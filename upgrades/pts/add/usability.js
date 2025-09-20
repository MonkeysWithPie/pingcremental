const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (1.22**(currentLevel)))
    },
    getDetails() {
        return {
            description: "gain __+2__ `pts` when ping is less/equal to 50",
            name: "prioritize usability",
            emoji: getEmoji('upgrade_usability', "📉"),
        }
    },
    getEffectString(level) {
        return `+${level*2}`
    },
    getEffect(level, context) {
        return {
            add: context.ping <= 50 ? level*2 : 0,
        }
    },
    unlockRequirements(context) {
        return { showable: true, buyable: true };
    },
    sortOrder() { return 3 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}