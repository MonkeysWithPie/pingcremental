const { UpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { formatNumber } = require('../../../helpers/formatNumber.js');

module.exports = {
    getPrice(currentLevel) {
        return 10000 * (20 ** currentLevel);
    },
    getDetails() {
        return {
            description: "gain __0.02%__ more pts for every PIP owned (up to __1,500__%)",
            name: "prospernity [🛍️]",
            emoji: "💲",
        }
    },
    getEffectString(level) {
        return `+${(level * 0.02).toFixed(2)}% \`pts\`, up to ${formatNumber(1500 * level)}`
    },
    getEffect(level, context) {
        if (!context.specials.allowShopkeeperUpgrades) return {};

        return {
            multiply: Math.min(level * 0.0002 * context.pip, 15 * level)
        }
    },
    isBuyable(context) {
        return context.fabrics.shopkeeper !== undefined;
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.MULT_BONUS }
}