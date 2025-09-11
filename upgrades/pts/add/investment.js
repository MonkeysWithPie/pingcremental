const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

function getPrice(level) {
    return Math.round(10_000 * (2.25**(level)))
}

function totalPts(level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += getPrice(i) * 0.0001;
    }
    return total;
}

module.exports = {
    getPrice,
    getDetails() {
        return {
            description: "add 0.01% of the __total `pts` spent on this upgrade__",
            name: "`pts`vestment [🛍️]",
            emoji: getEmoji('upgrade_slow', "🕓"),
        }
    },
    getEffectString(level) {
        return `+${totalPts(level).toFixed(1)} \`pts\` (${Math.round(totalPts(level) * 10000)} \`pts\` spent)`
    },
    getEffect(level, context) {
        if (!context.specials.allowShopkeeperUpgrades) return {};

        return {
            add: totalPts(level)
        }
    },
    isBuyable(context) {
        return context.fabrics.shopkeeper !== undefined;
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}