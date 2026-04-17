const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1000*(1.75**currentLevel))
    },
    getDetails() {
        return {
            description: "gain __+0.6__ `pts` per ping for every __350__ total clicks",
            name: "inpingity",
            emoji: getEmoji('upgrade_inpingity', "♾️"),
        }
    },
    getEffectString(level) {
        return `+${(level*0.6).toFixed(1)} per ${maxClicks(level)} clicks`
    },
    getEffect(level, context) {
        const totalClicks = context.stats.total.clicks;
        if (context.specials.superInpingity) {
            return {
                add: Math.round(level * (totalClicks * 0.88/(maxClicks(level))) * 0.6,2),
                multiply: 1 + (0.08 * level * (totalClicks / 888)),
            }
        }

        return {
            add: Math.round(level * (context.stats.eternity.clicks/(maxClicks(level))) * 0.6,2),
        }
    },
    unlockRequirements(context) {
        const totalClicks = context.stats.total.clicks;
        if (totalClicks >= 1000) {
            return { showable: true, buyable: true }
        }
        if (totalClicks <= 300) {
            return { showable: false }
        }
        return { showable: true, buyable: false, reason: `${totalClicks}/1,000 clicks`}
    },
    sortOrder() { return 8 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}

function maxClicks(level) {
    return Math.max(100,350-level+1);
}