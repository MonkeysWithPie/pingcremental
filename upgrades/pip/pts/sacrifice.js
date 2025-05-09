const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 6) return null;
        return 6**(currentLevel+4);
    },
    getDetails() {
        return {
            description: "__-20__ pts but __x1.5__ pts",
            name: "Sacrifice Simplicity",
            emoji: getEmoji('ponder_sacrifice', "⚙️"),
            flavor: "the best of progress inevitably becomes complex.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.5) + 1).toFixed(1)}`;
    },
    getEffect(level, context) {
        return {
            add: -20,
            multiply: (level*0.5) + 1,
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 2 },
    type() { return PipUpgradeTypes.BONUS }
}