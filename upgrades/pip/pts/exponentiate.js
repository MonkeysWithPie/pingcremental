const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: sacrificeUnlockRequirements } = require('./sacrifice.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (5.5 ** currentLevel)) + 450;
    },
    getDetails() {
        return {
            description: "gain __^1.02__ `pts`",
            name: "Exponentiate",
            emoji: getEmoji('ponder_exponentiate', "^"),
            flavor: "they only way out is up.",
        }
    },
    getEffectString(level) {
        return `^${((level*0.02)+1).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            exponent: (level*0.02) + 1,
        }
    },
    unlockRequirements(context) {
        if (!(sacrificeUnlockRequirements(context).buyable)) return { showable: false };
        let sacrificeUpgradeLevel = context.upgrades.sacrifice || 0;
        if (sacrificeUpgradeLevel < 2) return { showable: true, buyable: false, reason: `'Sacrifice Simplicity' ${sacrificeUpgradeLevel}/2` };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 3 },
    type() { return PipUpgradeTypes.BONUS },
    section() { return PingCalculationStates.SCORING; }
}