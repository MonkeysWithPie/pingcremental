const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 3) return null;
        return Math.round(66 ** (currentLevel / 4) * 2361);
    },
    getDetails() {
        return {
            description: "gain __+1__ APT when finding a blue ping",
            name: "automation",
            emoji: getEmoji('ponder_template', "⚙️"),
            flavor: "all things eventually converge on industry.",
        }
    },
    getEffectString(level) {
        return `${level} APT`;
    },
    getEffect(level, context) {
        if (!context.isSuper) return {};

        return {
            apt: level,
        }
    },
    upgradeRequirements() {
        return { exponentiate: 1 };
    },
    sortOrder() { return 204 },
    type() { return PipUpgradeTypes.MISC },
    section() { return PingCalculationStates.POST_SCORING; }
}