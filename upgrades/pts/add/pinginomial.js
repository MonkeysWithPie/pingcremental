const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round( 100 * (( 1.5 + ( currentLevel * 0.2 )) ** currentLevel))
    },
    getDetails() {
        return {
            description: "gain __+2^(level-1)__ pts",
            name: "pinginomial",
            emoji: getEmoji('upgrade_pinginomial', "📈"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "+0" : `+${2**(level-1)}`
    },
    getEffect(level, context) {
        return {
            add: 2**(level-1),
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 3 },
    type() { return UpgradeTypes.ADD_BONUS }
}