const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 63;
    },
    getDetails() {
        return {
            description: 
`-# no, not the animal, silly!
rolls a dice until it rolls a 1, totalling each number rolled. (e.g. rolls 3, 5, 2, 1 = 10)
gain a compounding **x1.07** \`pts\` for every score.`,
            name: "Pig Fabric",
            emoji: "🐖",
        }
    },
    getEffect(_level, context) {
        let roll = 0;
        let score = 0;

        while (true) {
            roll = Math.ceil(Math.random() * 6);
            if (roll === 1) break;

            score += roll;
        }

        return {
            special: {
                pigScore: score,
            },
            message: `rolled ${score}`,
            multiply: 1.07 ** score,
        }
    },
    type() { return FabricUpgradeTypes.PURE_RANDOM },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING; }
}