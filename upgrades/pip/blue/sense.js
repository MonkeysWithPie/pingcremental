const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1266 : null;
    },
    getDetails() {
        return {
            description: "get pinged when a blue ping appears",
            name: "Sixth Sense",
            emoji: getEmoji('ponder_sense', "👁️"),
            flavor: "open your mind to a new world.",
        }
    },
    getEffectString(level) {
        return level === 0 ? `inactive` : "active";
    },
    getEffect(level, context) {
        if (context.spawnedSuper) return {
            message: `<@${context.user.id}>`
        }
        return {}
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 101 },
    type() { return PipUpgradeTypes.BLUE_PING }
}