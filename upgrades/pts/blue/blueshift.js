const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 500 * (2**currentLevel)
    },
    getDetails() {
        return {
            description: "__+0.6%__ chance to spawn a blue ping (additive)",
            name: "blueshift",
            emoji: getEmoji('upgrade_blueshift', "🔵"),
        }
    },
    getEffectString(level) {
        return `+${(0.6*level).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            blue: level*0.6
        }
    },
    unlockRequirements(context) {
        if (context.upgrades.blue) return { showable: true, buyable: true };

        return { showable: true, buyable: false, reason: "buy 'blue ping'" };
    },
    sortOrder() { return 11 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}