const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 6) return null // max 90%
        return 100 * (15**(currentLevel+1))
    },
    getDetails() {
        return {
            description: "__15%__ chance the blue ping will spawn on the left",
            name: "budge",
            emoji: getEmoji('upgrade_budge', "⬅️"),
        }
    },
    getEffectString(level) {
        return `${level*15}%`
    },
    getEffect(level, context) {
        if (Math.random()*100 <= level*15) {
            return {
                special: { "budge": true },
            };
        }
        return {};
    },
    isBuyable(context) {
        return context.upgrades['blueshift'] && context.upgrades.blueshift > 6;
    },
    sortOrder() { return 15 },
    type() { return UpgradeTypes.BLUE_PING }
}