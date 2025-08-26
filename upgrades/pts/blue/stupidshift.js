const { UpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 10) return null;

        return 25000 * Math.round(1.8 ** currentLevel);
    },
    getDetails() {
        return {
            description: "randomly adds __-0.7% to 1.5%__ to blue ping chance",
            name: "stupidshift [🛍️]",
            emoji: "🌈",
        }
    },
    getEffectString(level) {
        return `${(-0.7 * level).toFixed(1)}% to ${(1.5 * level).toFixed(1)}%`;
    },
    getEffect(level, context) {
        if (!context.specials.allowShopkeeperUpgrades) return {};

        return {
            blue: (Math.random() * (1.5 + 0.7) - 0.7) * level
        }
    },
    isBuyable(context) {
        return context.fabrics.shopkeeper !== undefined && context.upgrades.blue;
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.BLUE_PING }
}