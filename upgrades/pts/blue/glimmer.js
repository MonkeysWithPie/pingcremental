const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 43234 : null; // 1-time but not in the category because blue takes priority
    },
    getDetails() {
        return {
            description: "after clicking a blue ping, the next 5 pings will give x1.2 pts",
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
                special: { "glimmer": -1 },
                multiply: 1.2,
                message: `(${context.glimmerClicks} left)`,
            }
        } else return {};
    },
    isBuyable(context) {
        return context.upgrades.budge && context.upgrades.budge > 1 && context.upgrades.blueshift && context.upgrades.blueshift > 3;
    },
    sortOrder() { return 17 },
    type() { return UpgradeTypes.BLUE_PING }
}