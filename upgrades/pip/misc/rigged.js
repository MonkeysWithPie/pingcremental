const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return [1000, 15000, 155000][currentLevel] || null;
    },
    getDetails() {
        return {
            description: "roll __1__ extra d20, take the higher result",
            name: "Loaded Dice",
            emoji: getEmoji('ponder_rigged', "🎲"),
            flavor: "maybe the house doesn't always win.",
        }
    },
    getEffectString(level) {
        return `+${level} d20`;
    },
    getEffect(level, context) {
        return {
            special: {
                "extraDice": level,
            }
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.beginning) return { showable: true, buyable: false, reason: "buy 'Eternity\'s Welcome'" };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 201 },
    type() { return PipUpgradeTypes.MISC },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}