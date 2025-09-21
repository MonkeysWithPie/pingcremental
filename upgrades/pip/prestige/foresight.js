const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: hoardUnlockRequirements } = require('./hoard.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(8.5**(currentLevel+1) * 325);
    },
    getDetails() {
        return {
            description: "gain 2.5 bp for every 1 million pts in your ping (rounded up)",
            name: "Foresight",
            emoji: getEmoji('ponder_foresight', "🔮"),
            flavor: "know before you go.",
        }
    },
    getEffectString(level) {
        return `+${(2.5*level).toFixed(1)} bp`
    },
    getEffect(level, context) {
        return {
            bp: Math.ceil(level * 2.5 * context.score / 1e6),
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