const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 20**(currentLevel+1) * 180;
    },
    getDetails() {
        return {
            description: "gain __+15%__ `pts` for every digit of total upgrade levels removed by visiting Eternity",
            name: "Vague Memories",
            emoji: getEmoji('ponder_vague', "☁️"),
            flavor: "sometimes all you can remember is that it happened.",
        }
    },
    getEffectString(level) {
        return `+${(level*15)}%`
    },
    getEffect(level, context) {
        return {
            multiply: (level*0.15*`${context.removedUpgrades}`.length) + 1,
        }
    },
    upgradeRequirements() {
        return { memory: 3 };
    },
    sortOrder() { return 303 },
    type() { return PipUpgradeTypes.KEEP },
    section() { return PingCalculationStates.SCORING; }
}