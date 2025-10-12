const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: hoardUnlockRequirements } = require('./hoard.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(8.5**(currentLevel+1) * 325);
    },
    getDetails() {
        return {
            description: "gain bp based on the amount of `pts` gained in a ping (softcapped)",
            name: "Foresight",
            emoji: getEmoji('ponder_foresight', "🔮"),
            flavor: "know before you go.",
        }
    },
    getEffectString(level) {
        return `x${level} bp`
    },
    getEffect(level, context) {
        const nonCapped = level * context.score / 1e6;
        if (nonCapped < 1000) return { bp: Math.ceil(nonCapped * 2.5) };
        const capped = 1000 + (nonCapped - 1000)**0.8;

        return {
            bp: Math.ceil(capped * 2.5),
        }
    },
    unlockRequirements(context) {
        if (!(hoardUnlockRequirements(context).buyable)) return { showable: false };
        let stardustLevel = context.upgrades.hoard || 0;
        if (stardustLevel < 2) return { showable: true, buyable: false, reason: `'Stardust' ${stardustLevel}/2` };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 406 },
    type() { return PipUpgradeTypes.PRESTIGE },
    section() { return PingCalculationStates.POST_SCORING; }
}