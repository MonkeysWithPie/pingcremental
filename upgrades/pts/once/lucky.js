const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 7770 : null;
    },
    getDetails() {
        return {
            description: "get +7 and x1.77 `pts` when ping ends in 7",
            name: "lucky number 7",
            emoji: getEmoji('upgrade_lucky', "🍀"),
        }
    },
    getEffectString(level) {
        return level === 1 ? "+7, x1.77" : "+0, x1.00";
    },
    getEffect(level, context) {
        return {
            add: (context.ping % 10 === 7) ? 7 : undefined,
            multiply: (context.ping % 10 === 7) ? 1.77 : undefined,
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.special) return { showable: true, buyable: false, reason: "buy 'i feel special'" };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 101 },
    type() { return UpgradeTypes.ONE_TIME },
    section() { return PingCalculationStates.SCORING; }
}