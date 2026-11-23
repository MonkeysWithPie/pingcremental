const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const formatNumber = require('../../../helpers/formatNumber.js');

function getPrice(level) {
    return Math.round(10_000 * (2.25**(level)))
}

function totalPts(level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += Math.log10(getPrice(i)) * 10;
    }
    return Math.round(total);
}

module.exports = {
    getPrice,
    getDetails() {
        return {
            description: "add `pts` based on __`pts` spent on this upgrade__",
            name: "`pts`vestment [🛍️]",
            emoji: getEmoji('upgrade_slow', "🕓"),
        }
    },
    getEffectString(level) {
        return `+${formatNumber(totalPts(level))} \`pts\``
    },
    getEffect(level, context) {
        if (!context.specials.allowShopkeeperUpgrades) return {};

        return {
            add: totalPts(level)
        }
    },
    unlockRequirements(context) {
        if (context.fabrics.shopkeeper) return { showable: true, buyable: true };
        return { showable: false };
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}