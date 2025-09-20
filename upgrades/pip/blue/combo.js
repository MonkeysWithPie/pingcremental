const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: indigoUnlockRequirements } = require('./indigo.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(103 * (currentLevel)**4) + 1234;
    },
    getDetails() {
        return {
            description: "gain __1.15x__ `pts` for each blue ping in the current combo",
            name: "Chain Combo",
            emoji: getEmoji('ponder_combo', "🔗"),
            flavor: "a rare coincidence twisted to an incredible feat.",
        }
    },
    getEffectString(level) {
        return `x${((0.15 * level)+1).toFixed(2)}`
    },
    getEffect(level, context) {
        if (context.blueCombo - 1 > 0) return {
            multiply: (level*0.15 * (context.blueCombo - 1)) + 1,
        }
        return {}
    },
    unlockRequirements(context) {
        if (!indigoUnlockRequirements(context).buyable) return { showable: false };
        let indigoLevel = context.upgrades.indigo || 0;
        if (indigoLevel < 4) return { showable: true, buyable: false, reason: `'Indigo Vision' ${indigoLevel}/4` };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 106 },
    type() { return PipUpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.SCORING; }
}
