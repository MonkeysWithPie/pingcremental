const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1000*(1.75**currentLevel))
    },
    getDetails() {
        return {
            description: "gain __+0.6__ pts per ping for every __350__ clicks",
            name: "inpingity",
            emoji: getEmoji('upgrade_inpingity', "♾️"),
        }
    },
    getEffectString(level) {
        return `+${(level*0.6).toFixed(1)} per ${maxClicks(level)} clicks`
    },
    getEffect(level, context) {
        return {
            add: Math.round(level * (context.clicks/(maxClicks(level))) * 0.6,2),
        }
    },
    isBuyable(context) {
        return context.totalClicks >= 1000;
    },
    sortOrder() { return 8 },
    type() { return UpgradeTypes.ADD_BONUS }
}

function maxClicks(level) {
    return Math.max(100,350-level+1);
}