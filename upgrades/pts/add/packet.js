const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(50 * (1.25**(currentLevel)))
    },
    getDetails() {
        return {
            description: "gain 0 to __1__ extra `pts` per ping",
            name: "packet loss",
            emoji: getEmoji('upgrade_packet', "💻"),
        }
    },
    getEffectString(level) {
        return `up to ${level} \`pts\``
    },
    getEffect(level, context) {
        if (level <= 0) return {};

        return {
            add: Math.floor(Math.random() * (level+1))
        }
    },
    isBuyable(context) {
        return context.upgrades.slow >= 3;
    },
    sortOrder() { return 3 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}