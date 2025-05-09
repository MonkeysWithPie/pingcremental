const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel*0.5 >= 10) return null; // 10% max
        return 350 * (2**currentLevel)
    },
    getDetails() {
        return {
            description: "__+0.5%__ (additive) chance to get x3 pts",
            name: "pipiping",
            emoji: getEmoji('upgrade_pipiping', "🔁"),
        }
    },
    getEffectString(level) {
        return `${(level*0.5).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            multiply: Math.random()*1000 <= (level*5) ? 3 : undefined,
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 5 },

    type() { return UpgradeTypes.MULT_BONUS }
}