const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 275;
    },
    getDetails() {
        return {
            description: 
`gain **2** extra fabric slots.
gives a passive **^0.8** pts debuff.`,
            name: "Antimatter Fabric",
            emoji: "🌑",
        }
    },
    getEffect(_level, context) {
        return {
            exponent: 0.8,
            special: {
                extraFabricSlots: 2,
            }
        }
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING; },
}