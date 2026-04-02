const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 37;
    },
    getDetails() {
        return {
            description: 
`gain **1,000** bp per ping.
increase max bp by **90,000** then **x2**.
gain **x1.5** pip.`,
            name: "Eternal Fabric",
            emoji: "♾️",
        }
    },
    getEffect() {
        return {
            bp: 1000,
            special: {
                bpExtraStorage: 90000,
                bpStorageMult: 2,
                pipMult: 1.5,
            },
        }
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return true; },
    section() { PingCalculationStates.POST_SCORING; }
}