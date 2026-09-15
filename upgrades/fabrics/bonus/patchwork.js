const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 44;
    },
    getDetails() {
        return {
            description: 
`Gain **x1.35** (compounding) for every type of fabric you own.`,
            name: "Patchwork Fabric",
            emoji: "🧵",
        }
    },
    getEffect(_level, context) {
        return {
            multiply: 1.35 ** context.totalFabrics,
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING; },
}