const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 5) return null; // max of 5
        return Math.round(1250 * (2.2**(currentLevel**1.25)));
    },
    getDetails() {
        return {
            description: "__x1.15__ chance to spawn a blue ping (after other upgrades)",
            name: "greenshift?",
            emoji: getEmoji('upgrade_greenshift', "🟢"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.15).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            blue: context.blue * level * 0.15
        }
    },
    isBuyable(context) {
        if (!context.upgrades['blue'] || !context.upgrades['redshift']) return false;
        return context.upgrades['redshift'] >= 4;
    },
    sortOrder() { return 14 },
    type() { return UpgradeTypes.BLUE_PING }
}