const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: riggedUnlockRequirements } = require('./rigged.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(66**(currentLevel/2) * 2361);
    },
    getDetails() {
        return {
            description: "ping __0.5__ extra times, pick the best result (0.5 = 50% of 1 extra)",
            name: "Favored",
            emoji: getEmoji('ponder_favored', "🍀"),
            flavor: "little hints that the universe is on your side.",
        }
    },
    getEffectString(level) {
        return `${(level*0.5).toFixed(1)} pings`
    },
    getEffect(level) {
        return {
            special: {
                "rerolls": level * 0.5,
            }
        }
    },
    unlockRequirements(context) {
        if (!(riggedUnlockRequirements(context).buyable)) return { showable: false };
        if (!context.upgrades.rigged) return { showable: true, buyable: false, reason: `buy 'Loaded Dice'` };
        
        return { showable: true, buyable: true };
    },
    sortOrder() { return 202 }, // NO WAY CELESTE REFERNECE!?!?/
    type() { return PipUpgradeTypes.MISC },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}