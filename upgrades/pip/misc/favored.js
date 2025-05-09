const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(66**(currentLevel/2) * 2361);
    },
    getDetails() {
        return {
            description: "RNG events like rare pings are __x1.5__ as likely to occur",
            name: "Favored",
            emoji: getEmoji('ponder_favored', "🍀"),
            flavor: "little hints that the universe is on your side.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.5)+1).toFixed(1)}`
    },
    getEffect(level, context) {
        return {
            special: {
                RNGmult: (level*0.5)+1,
            }
        }
    },
    upgradeRequirements() {
        return { rigged: 1 };
    },
    sortOrder() { return 202 }, // NO WAY CELESTE REFERNECE!?!?/
    type() { return PipUpgradeTypes.MISC }
}