const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

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
    upgradeRequirements() {
        return { hoard: 2 };
    },
    sortOrder() { return 405 }, // upgrade IS found (i'm not using 404 to spite you)
    type() { return PipUpgradeTypes.PRESTIGE },
    section() { return PingCalculationStates.POST_SCORING; }
}