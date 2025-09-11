const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const RandSeed = require('rand-seed').default;

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 7007 : null;
    },
    getDetails() {
        return {
            description: "does some stuff, sometimes",
            name: "cat?",
            emoji: getEmoji('ponder_cat', "🐱"),
            flavor: "what the hell is this guy doing here?",
        }
    },
    getEffectString(level) {
        return level > 0 ? "cat :D" : "no cat D:"
    },
    getEffect(level, context) {
        const roll = new RandSeed(`${context.interactionTimestamp}cat`).next();

        if (roll < 0.65) { // 65%
            return {
                add: 5 + Math.floor(Math.random()*20), // add 5-25
                message: "mrrow!"
            }
        } else if (roll < 0.9) { // 25%
            return {
                multiply: 1.2 + Math.random()*0.5, // multiply by 1.2-1.7
                message: "mrrp!",
            }
        } else { // 10%
            return {
                // force a blue ping to spawn
                blue: 100,
                blueCap: 100,
                message: "\`Blue!\` purrrr!",
            }
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 203 },
    type() { return PipUpgradeTypes.MISC },
    section() { return PingCalculationStates.RNG_AND_SPECIAL | PingCalculationStates.SCORING; }
}