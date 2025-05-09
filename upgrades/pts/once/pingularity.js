const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1000000 : null;
    },
    getDetails() {
        return {
            description: "?",
            name: "pingularity",
            emoji: getEmoji('upgrade_pingularity', "▪️"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "inactive" : "active";
    },
    getEffect(level, context) {
        return {}
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.ONE_TIME }
}