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
        const seed = new RandSeed(context.rngSeed + "pipcat");
        const roll = seed.next();

        if (roll < 0.65) { // 65%
            return {
                add: 1 + Math.floor(seed.next()*50),
                message: "mrrow!"
            }
        } else if (roll < 0.9) { // 25%
            return {
                multiply: 1.2 + seed.next()*0.7,
                message: "mrrp!",
            }
        }  // 10%
            return {
                apt: 1 + Math.floor(seed.next()*5),
                message: "purrrr!",
            }
        
    },
    unlockRequirements(context) {
        if (!context.upgrades.beginning) return { showable: true, buyable: false, reason: "buy 'Eternity's Welcome'" };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 203 },
    type() { return PipUpgradeTypes.MISC },
    section() { return PingCalculationStates.RNG_AND_SPECIAL | PingCalculationStates.SCORING | PingCalculationStates.POST_SCORING; },
    getMax() { return 1; }
}