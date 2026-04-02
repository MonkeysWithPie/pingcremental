const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: redshiftUnlockRequirements } = require('../blue/redshift.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (1.45**(currentLevel)));
    },
    getDetails() {
        return {
            description: "gain __x1.02__ `pts`",
            name: "fine, just have a multiplier",
            emoji: getEmoji('upgrade_multiplier', "X"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.02).toFixed(2)}`
    },
    getEffect(level) {
        return {
            multiply: 1+level*0.02,
        }
    },
    unlockRequirements(context) {
        if (!redshiftUnlockRequirements(context).buyable) return { showable: false };
        if (!context.upgrades.redshift) return { showable: true, buyable: false, reason: "buy 'redshift'" };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 14 },
    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; }
}