const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: redshiftUnlockRequirements } = require('./redshift.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 5) return null; // max of 5
        return Math.round(1250 * (2.2**(currentLevel**1.25)));
    },
    getDetails() {
        return {
            description: "__x1.15__ chance to spawn a blue ping (after other upgrades)",
            name: "greenshift?",
            emoji: getEmoji('upgrade_greenshift', "🟢"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.15).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            blue: context.blue * level * 0.15
        }
    },
    unlockRequirements(context) {
        if (!(redshiftUnlockRequirements(context).buyable)) return { showable: false };

        const redshiftLevel = context.upgrades.redshift || 0;
        if (redshiftLevel < 4) return { showable: true, buyable: false, reason: `'redshift' ${redshiftLevel}/4` };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 14 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; },
    getMax() { return 5; }
}