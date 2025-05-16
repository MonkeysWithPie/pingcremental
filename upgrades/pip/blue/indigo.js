const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 1)**3.5) + 1111;
    },
    getDetails() {
        return {
            description: "blue pings are __15%__ stronger",
            name: "Indigo Vision",
            emoji: getEmoji('ponder_indigo', "💙"),
            flavor: "seeing an almost alternate reality.",
        }
    },
    getEffectString(level) {
        return `+${level*15}%`
    },
    getEffect(level, context) {
        return {
            blueStrength: (level*0.15),
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 102 },
    type() { return PipUpgradeTypes.BLUE_PING }
}