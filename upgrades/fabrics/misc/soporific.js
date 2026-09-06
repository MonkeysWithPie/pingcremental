const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 55;
    },
    getDetails() {
        return {
            description: 
`makes slumber only take **1 minute** per charge, regardless of level.
increases the maximum amount of slumber charges to **300**.
slumber gives a **^1.03** bonus per level in addition to its multiplier (e.g. ^1.06 at level 2).`,
            name: "Soporific Fabric",
            emoji: "🛌",
        }
    },
    getEffect() {
        return {
            special: {
                superSlumber: true,
            }
        }
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return true; },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}