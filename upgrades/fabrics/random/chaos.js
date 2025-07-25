const { FabricUpgradeTypes } = require('../../../helpers/commonEnums.js');
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
        const roll = new RandSeed(`${context.interactionTimestamp}`).next() * 100;

        if (roll < 25) {
            return {
                add: Math.round(Math.random() * 1000 * level),
            }
        }
        else if (roll < 50) {
            return {
                multiply: 1 + (Math.random() * 49) ** level, 
            }
        }
        else if (roll < 56) {
            return {
                exponent: 1 + (Math.random() * 0.15) ** level,
            }
        }
        else if (roll < 70) {
            return {
                bp: Math.round(Math.random() * 3000 * level),
            }
        }
        else if (roll < 76) {
            return {
                apt: Math.round(Math.random() * 15 * level),
            }
        }
        else {
            const msg = [`nah`, `not feelin it`, `forget it`, `no thanks`, `not today`, `nuh uh`, `ehh`, `maybe later`, `nope`, `not right now`]
            return {
                message: msg[Math.floor(Math.random() * msg.length)],
            }
        }
    },
    type() { return FabricUpgradeTypes.PURE_RANDOM },
    isUnique() { return false; }
}