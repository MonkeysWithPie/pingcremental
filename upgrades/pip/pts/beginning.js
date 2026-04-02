const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1000 : null;
    },
    getDetails() {
        return {
            description: "gain 2x `pts`",
            name: "Eternity's Welcome",
            emoji: getEmoji('ponder_beginning', "🌃"),
            flavor: "Eternity is glad to have you. it hopes you are glad to have it, as well.",
        }
    },
    getEffectString(level) {
        return level === 0 ? "x1" : "x2";
    },
    getEffect() {
        return {
            multiply: 2,
        }
    },
    unlockRequirements() {
        return { showable: true, buyable: true };
    },
    sortOrder() { return 1 },
    type() { return PipUpgradeTypes.BONUS },
    section() { return PingCalculationStates.SCORING; }
}