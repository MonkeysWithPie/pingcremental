const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: blueshiftUnlockRequirements } = require('../blue/blueshift.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 6) return null // max 90%
        return 100 * (15**(currentLevel+1))
    },
    getDetails() {
        return {
            description: "__15%__ chance the blue ping will spawn on the left",
            name: "budge",
            emoji: getEmoji('upgrade_budge', "⬅️"),
        }
    },
    getEffectString(level) {
        return `${level*15}%`
    },
    getEffect(level, context) {
        if (Math.random()*100 <= level*15) {
            return {
                special: { "budge": true },
            };
        }
        return {};
    },
    unlockRequirements(context) {
        if (!(blueshiftUnlockRequirements(context).buyable)) return { showable: false };

        let blueshiftLevel = context.upgrades.blueshift || 0;
        if (blueshiftLevel < 7) {
            return { showable: true, buyable: false, reason: `'blueshift' ${blueshiftLevel}/7` };
        }

        return { showable: true, buyable: true };
    },
    sortOrder() { return 15 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL },
}