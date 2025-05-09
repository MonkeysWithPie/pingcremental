const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 20**(currentLevel+2) * 180;
    },
    getDetails() {
        return {
            description: "gain __+0.3%__ pts for every upgrade level removed",
            name: "Vague Memories",
            emoji: getEmoji('ponder_vague', "☁️"),
            flavor: "sometimes all you can remember is that it happened.",
        }
    },
    getEffectString(level) {
        return `+${(level*0.3).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            multiply: (level*0.003*context.removedUpgrades) + 1,
        }
    },
    upgradeRequirements() {
        return { memory: 3 };
    },
    sortOrder() { return 303 },
    type() { return PipUpgradeTypes.KEEP }
}