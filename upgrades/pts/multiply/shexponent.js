const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1000 * (100 ** (currentLevel ** 1.2)));
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
    unlockRequirements(context) {
        if (!context.fabrics.shopkeeper) return { showable: false };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; }
}