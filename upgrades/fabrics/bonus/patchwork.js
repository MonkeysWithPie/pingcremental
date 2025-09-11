const { FabricUpgradeTypes } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 44;
    },
    getDetails() {
        return {
            description: 
`Gain **x1.4** (compounding) for every type of fabric you own.`,
            name: "Patchwork Fabric",
            emoji: "🧵",
        }
    },
    getEffect(_level, context) {
        return {
            multiply: 1.4 ** context.totalFabrics,
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return true; }
}