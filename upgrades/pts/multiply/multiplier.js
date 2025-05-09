const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        let price = 100;
        let prevPrice = 100;
        let temp = 0;

        for (let i = 0; i < currentLevel; i++) {
            temp = prevPrice;
            prevPrice = price;
            price += temp;
        }

        return price;
    },
    getDetails() {
        return {
            description: "gain __x1.02__ pts",
            name: "fine, just have a multiplier",
            emoji: getEmoji('upgrade_multiplier', "**X**"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.02).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            multiply: 1+level*0.02,
        }
    },
    isBuyable(context) {
        return context.upgrades && context.upgrades.redshift;
    },
    sortOrder() { return 14 },
    type() { return UpgradeTypes.MULT_BONUS }
}