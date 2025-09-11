const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 814 : null;
    },
    getDetails() {
        return {
            description: 'budge deletes "ping again" instead of moving it',
            name: "Bully",
            emoji: getEmoji('ponder_bully', '🤜'),
            flavor: "a sacrifice of one for the benefit of... also one.",
        }
    },
    getEffectString(level) {
        return level === 0 ? "move" : "delete"
    },
    getEffect(level, context) {
        return {
            special: { "bully": context.spawnedSuper },
        }
    },
    upgradeRequirements() {
        return { sense: 1 };
    },
    sortOrder() { return 103 },
    type() { return PipUpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}