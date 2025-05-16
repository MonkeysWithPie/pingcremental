const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 1)**4.5) + 2322;
    },
    getDetails() {
        return {
            description: "blue pings are __0.1%__ stronger for every blue ping missed, up to __200__",
            name: "Regret",
            emoji: getEmoji('ponder_regret', "😔"),
            flavor: "sometimes the past is painful. but it is also a part of you.",
        }
    },
    getEffectString(level) {
        return `${(level*0.1).toFixed(1)}%, up to ${((level*100)+100)}`
    },
    getEffect(level, context) {
        return {
            blueStrength: (level*0.001)* Math.min(context.missedBluePings,(level*100)+100),
        }
    },
    upgradeRequirements() {
        return { indigo: 3 };
    },
    sortOrder() { return 104 },
    type() { return PipUpgradeTypes.BLUE_PING }
}