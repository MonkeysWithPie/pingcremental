const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1000 : null
    },
    getDetails() {
        return {
            description: "getting a rare ping message gives 100x `pts`",
            name: "i feel special",
            emoji: getEmoji('upgrade_special', "✨"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "1x" : "100x"
    },
    getEffect(level, context) {
        return {
            multiply: context.rare ? 100 : 1,
            message: context.rare ? "WHOA!" : null,
        }
    },
    unlockRequirements() {
        return { showable: true, buyable: true };
    },
    sortOrder() { return 100 },
    type() { return UpgradeTypes.ONE_TIME },
    section() { return PingCalculationStates.SCORING; }
}