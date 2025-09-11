const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 1)**4.5) + 2322;
    },
    getDetails() {
        return {
            description: "blue pings are __0.2%__ stronger for every blue ping missed",
            name: "Regret",
            emoji: getEmoji('ponder_regret', "😔"),
            flavor: "sometimes the past is painful. but it is also a part of you.",
        }
    },
    getEffectString(level) {
        return `${(level*0.2).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            blueStrength: (level*0.002)*context.missedBluePings,
        }
    },
    upgradeRequirements() {
        return { indigo: 3 };
    },
    sortOrder() { return 104 },
    type() { return PipUpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL }
}