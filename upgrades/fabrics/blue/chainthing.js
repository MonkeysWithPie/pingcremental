const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 35;
    },
    getDetails() {
        return {
            description: 
`gain **^1.01** pts per blue ping in a chain, up to a max of **^1.5** (e.g. 2 in a row gives ^1.02 pts).
increases the blue ping chance after another blue ping by **10%** (NOT bypassing the cap).`,
            name: "Cascading Fabric",
            emoji: "🌊",
        }
    },
    getEffect(level, context) {
        if (context.blueCombo > 0) {
            return {
                exponent: Math.min(1 + (0.01 * context.blueCombo), 1.5),
                blue: 10,
            }
        }

        return {};
    },
    type() { return FabricUpgradeTypes.BLUE_PING },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING; },
}