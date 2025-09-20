const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: budgeUnlockRequirements } = require('./budge.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 43234 : null; // 1-time but not in the category because blue takes priority
    },
    getDetails() {
        return {
            description: "after clicking a blue ping, the next 5 pings will give x1.2 `pts`",
            name: "glimmer",
            emoji: getEmoji('upgrade_glimmer', "✨"),
        }
    },
    getEffectString(level) {
        return level === 1 ? `x1.2` : `x1`;
    },
    getEffect(level, context) {
        if (context.isSuper) {
            return {
                special: { "glimmer": +5 },
                message: `(${context.glimmerClicks}**+5** left)`,
            }
        } else if (context.glimmerClicks) {
            return {
                special: { "glimmer": (context.specials.glimmer || 0) - 1 },
                multiply: 1.2,
                message: `(${context.glimmerClicks} left)`,
            }
        } else return {};
    },
    unlockRequirements(context) {
        if (!budgeUnlockRequirements(context).buyable) return { showable: false };
        if (!context.upgrades.budge) return { showable: true, buyable: false, reason: `buy 'budge'` };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 17 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.SCORING; }
}