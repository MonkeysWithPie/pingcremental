const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 1000 * (100 ** currentLevel);
    },
    getDetails() {
        return {
            description: "gain __^1.02__ pts",
            name: "more exponents [🛍️]",
            emoji: "📈",
        }
    },
    getEffectString(level) {
        return `^${level*0.02 + 1} \`pts\``
    },
    getEffect(level, context) {
        if (!context.specials.allowShopkeeperUpgrades) return {};

        return {
            exponent: level*0.02 + 1
        }
    },
    isBuyable(context) {
        return context.fabrics.shopkeeper !== undefined;
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; }
}