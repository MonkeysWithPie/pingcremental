const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 41;
    },
    getDetails() {
        return {
            description: 
`adds **40%** blue ping chance.
"blueshift" adds a compounding **x1.1** blue ping multiplier instead of adding blue ping chance.`,
            name: "Spectrum Fabric",
            emoji: "",
        }
    },
    getEffect(_level, context) {
        return {
            blue: 40 - (context.upgrades.blueshift ? 0 : 0.6 * context.upgrades.blueshift),
            blueStrength: (context.upgrades.blueshift ? 1.1 ** context.upgrades.blueshift : 1) - 1,
        }
    },
    type() { return FabricUpgradeTypes.BLUE_PING },
    isUnique() { return true; },
    section() { return PingCalculationStates.RNG_AND_SPECIAL },
}