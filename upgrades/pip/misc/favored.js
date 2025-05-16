const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(66**(currentLevel/2) * 2361);
    },
    getDetails() {
        return {
            description: "RNG events like rare pings are __x1.25__ as likely to occur",
            name: "Favored",
            emoji: getEmoji('ponder_favored', "🍀"),
            flavor: "little hints that the universe is on your side.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.25)+1).toFixed(1)}`
    },
    getEffect(level, context) {
        return {
            RNGmult: (level*0.25),
        }
    },
    upgradeRequirements() {
        return { rigged: 1 };
    },
    sortOrder() { return 202 }, // NO WAY CELESTE REFERNECE!?!?/
    type() { return PipUpgradeTypes.MISC }
}