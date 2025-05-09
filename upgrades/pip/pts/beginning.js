const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1000 : null;
    },
    getDetails() {
        return {
            description: "gain 2x pts",
            name: "Eternity's Welcome",
            emoji: getEmoji('ponder_beginning', "🌃"),
            flavor: "Eternity is glad to have you. it hopes you are glad to have it, as well.",
        }
    },
    getEffectString(level) {
        return level === 0 ? "x1" : "x2";
    },
    getEffect(level, context) {
        return {
            multiply: 2,
        }
    },
    upgradeRequirements() {
        return {};
    },
    sortOrder() { return 1 },
    type() { return PipUpgradeTypes.BONUS }
}