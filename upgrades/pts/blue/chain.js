const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 4) return null; // cap at +20%
        return Math.round(3500 * ((3*currentLevel)**2 + 1));
    },
    getDetails() {
        return {
            description: "__+5%__ chance to find a blue ping after a different blue ping",
            name: "blue chain",
            emoji: getEmoji('upgrade_chain', "🔗"),
        }
    },
    getEffectString(level) {
        return `+${(level * 5)}%`
    },
    getEffect(level, context) {
        return {
            blue: context.isSuper ? level * 5 : 0,
        }
    },
    isBuyable(context) {
        if (!context.upgrades['blue'] || !context.upgrades['blueshift']) return false;
        return context.upgrades['blueshift'] >= 3;
    },
    sortOrder() { return 13 },
    type() { return UpgradeTypes.BLUE_PING }
}