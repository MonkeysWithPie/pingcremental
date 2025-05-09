const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        let origPrice = 888 * (2.6**(currentLevel)) // split for sake of being readable
        return Math.round(origPrice/1000)*1000 + 888
    },
    getDetails() {
        return {
            description: "gain __x1.11__ pts when last two digits of ping are the same",
            name: "pattern recognision",
            emoji: getEmoji('upgrade_pattern', "🔍"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.11).toFixed(2)}`
    },
    getEffect(level, context) {
        const pString = `${context.ping}`
        return {
            multiply: (pString[0] === pString[1]) ? 1 + (level*0.11) : 1,
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('lucky');
    },
    sortOrder() { return 102 },
    type() { return UpgradeTypes.MULT_BONUS }
}