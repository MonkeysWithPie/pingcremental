const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 23**(currentLevel+1) * 333;
    },
    getDetails() {
        return {
            description: "gain __+20%__ `pts` per digit in your owned PIP count",
            name: "Stardust",
            emoji: getEmoji('ponder_hoard', "🌌"),
            flavor: "the stars offer both beauty and utility.",
        }
    },
    getEffectString(level) {
        return `+${level*20}% per digit`
    },
    getEffect(level, context) {
        return {
            multiply: 1 + (`${Math.round(context.pip)}`.length * level * 0.2),
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.beginning) return { showable: true, buyable: false, reason: "buy 'Eternity's Welcome'" };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 405 },
    type() { return PipUpgradeTypes.PRESTIGE },
    section() { return PingCalculationStates.SCORING; }
}