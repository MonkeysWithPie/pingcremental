const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 88;
    },
    getDetails() {
        return {
            description: 
`inpingity will use **88%** of your FOREVER total clicks instead of 100% of an eternity's clicks.
inpingity will give an additional **x1.08** bonus per **888** total clicks you have (increasing with its level).`,
            name: "Fabric of Eights and Infinities",
            emoji: "🎱",
        }
    },
    getEffect() {
        return {
            special: {
                superInpingity: true,
            }
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return true; },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}