const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 53;
    },
    getDetails() {
        return {
            description: "rare pings give a bonus **^1.25** pts.",
            name: "Elusive Fabric",
            emoji: "💍",
        }
    },
    getEffect(level, context) {
        if (context.rare) {
            return {
                exponent: 1.25 ** level,
            }
        }

        return {};
    },
    type() { return FabricUpgradeTypes.PURE_RANDOM },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING; }
}