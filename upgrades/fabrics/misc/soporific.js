const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 55;
    },
    getDetails() {
        return {
            description: 
`makes slumber only take **1 minute** per charge.
increases the maximum amount of slumber charges to **300**.
adds an additional **x15** multiplier to slumber (e.g. x1.1 \\* x15 = x16.5 total multiplier).`,
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