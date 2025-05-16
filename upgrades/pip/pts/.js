const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "gain __+0.02%__ pts for every total click",
            name: "",
            emoji: getEmoji('ponder_template'),
            flavor: "",
        }
    },
    getEffectString(level) {
        return `+${(level * 0.02).toFixed(2)}% each`
    },
    getEffect(level, context) {
        return {
            multiply: ((context.totalClicks) * (level * 0.02) / 100) + 1,
        }
    },
    upgradeRequirements() {
        return { exponentiate: 2 };
    },
    sortOrder() { return 4 },
    type() { return PipUpgradeTypes.BONUS }
}