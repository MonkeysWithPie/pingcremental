const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 23**(currentLevel+1) * 333;
    },
    getDetails() {
        return {
            description: "gain __+20%__ pts per digit in your owned PIP count",
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
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 402 },
    type() { return PipUpgradeTypes.PRESTIGE }
}