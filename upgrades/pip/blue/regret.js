const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 1)**4.5) + 2322;
    },
    getDetails() {
        return {
            description: "blue pings are __0.25%__ stronger for every blue ping missed",
            name: "Regret",
            emoji: getEmoji('ponder_regret', "😔"),
            flavor: "sometimes the past is painful. but it is also a part of you.",
        }
    },
    getEffectString(level) {
        return `${(level*0.25).toFixed(2)}%`
    },
    getEffect(level, context) {
        return {
            blueStrength: (level*0.0025)*context.missedBluePings,
        }
    },
    upgradeRequirements() {
        return { indigo: 3 };
    },
    sortOrder() { return 104 },
    type() { return PipUpgradeTypes.BLUE_PING }
}