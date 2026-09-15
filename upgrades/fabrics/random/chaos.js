const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const RandSeed = require("rand-seed").default;

module.exports = {
    getPrice() {
        return 137;
    },
    getDetails() {
        return {
            description: `does whatever it wants to.`,
            name: "Chaotic Fabric",
            emoji: "🔀",
        }
    },
    getEffect(level, context) {
        const seed = new RandSeed(context.rngSeed + "fabricchaos");
        const roll = seed.next() * 100;

        if (roll < 25) {
            return {
                add: Math.round(seed.next() * 1000 * level),
            }
        }
        else if (roll < 50) {
            return {
                multiply: 1 + (seed.next() * 49) ** level, 
            }
        }
        else if (roll < 56) {
            return {
                exponent: (1 + (seed.next() * 0.25)) ** level,
            }
        }
        else if (roll < 70) {
            return {
                bp: Math.round(seed.next() * 3500 * level) + 1500,
            }
        }
        else if (roll < 76) {
            return {
                apt: Math.round(seed.next() * 15 * level),
            }
        }
        
            const msg = [`nah`, `not feelin it`, `forget it`, `no thanks`, `not today`, `nuh uh`, `ehh`, `maybe later`, `nope`, `not right now`]
            return {
                message: msg[Math.floor(Math.random() * msg.length)],
            }
        
    },
    type() { return FabricUpgradeTypes.PURE_RANDOM },
    isUnique() { return false; },
    section() { return PingCalculationStates.POST_SCORING | PingCalculationStates.SCORING | PingCalculationStates.RNG_AND_SPECIAL; },
}