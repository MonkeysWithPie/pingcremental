const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 42;
    },
    getDetails() {
        return {
            description: "gives a **x0.4** debuff, then grants a **^1.2** bonus.",
            name: "Magmatic Fabric",
            emoji: "🌋",
        }
    },
    getEffect(level, context) {
        return {
            multiply: 0.4 ** level,
            exponent: 1.2 ** level,
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return false; },
    section() { return PingCalculationStates.SCORING; },
}