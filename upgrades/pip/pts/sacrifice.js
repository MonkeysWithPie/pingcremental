const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel > 7) return null;
        return 5**(currentLevel+4);
    },
    getDetails() {
        return {
            description: "__-20__ `pts` but __x1.5__ `pts`",
            name: "Sacrifice Simplicity",
            emoji: getEmoji('ponder_sacrifice', "⚙️"),
            flavor: "the best of progress inevitably becomes complex.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.5) + 1).toFixed(1)}`;
    },
    getEffect(level) {
        return {
            add: -20,
            multiply: (level*0.5) + 1,
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.beginning) return { showable: true, buyable: false, reason: "buy 'Eternity's Welcome'" };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 2 },
    type() { return PipUpgradeTypes.BONUS },
    section() { return PingCalculationStates.SCORING; },
    getMax() { return 8; }
}