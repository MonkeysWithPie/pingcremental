const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 35;
    },
    getDetails() {
        return {
            description: "grants a flat **x20** multiplier.",
            name: "Gold-Laced Fabric",
            emoji: "🔸",
        }
    },
    getEffect(level) {
        return {
            multiply: 20 ** level,
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return false; },
    section() { return PingCalculationStates.SCORING; }
}