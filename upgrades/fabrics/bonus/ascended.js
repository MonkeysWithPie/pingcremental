const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 111;
    },
    getDetails() {
        return {
            description: "does nothing. unless you maybe use three of them...",
            name: "Ascended Fabric",
            emoji: "☀️",
        }
    },
    getEffect(level, ) {
        if (level >= 3) {
            return {
                exponent: 1.5,
            }
        }

        return {};
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return false; },
    section() { return PingCalculationStates.SCORING; },
}