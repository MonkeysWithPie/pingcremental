const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: senseUnlockRequirements } = require('./sense.js');

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
            special: { "bully": true },
        }
    },
    unlockRequirements(context) {
        if (!senseUnlockRequirements(context).buyable) return { showable: false };
        if (!context.upgrades.sense) return { showable: true, buyable: false, reason: "buy 'Sixth Sense'" };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 102 },
    type() { return PipUpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}