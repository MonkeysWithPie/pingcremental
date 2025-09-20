const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: blueshiftUnlockRequirements } = require('../blue/blueshift.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 4) return null; // cap at +20%
        return Math.round(3500 * ((3*currentLevel)**2 + 1));
    },
    getDetails() {
        return {
            description: "__+5%__ chance to find a blue ping after a different blue ping, bypassing the 35% cap",
            name: "blue chain",
            emoji: getEmoji('upgrade_chain', "🔗"),
        }
    },
    getEffectString(level) {
        return `+${(level * 5)}%`
    },
    getEffect(level, context) {
        if (context.isSuper) {
            return {
                blue: level * 5,
                blueCap: level * 5,
            }
        }
        return {}
    },
    unlockRequirements(context) {
        if (!(blueshiftUnlockRequirements(context).buyable)) return { showable: false };

        let blueshiftLevel = context.upgrades.blueshift || 0;
        if (blueshiftLevel < 3) return { showable: true, buyable: false, reason: `'blueshift' ${blueshiftLevel}/3` };
        
        return { showable: true, buyable: true };
    },
    sortOrder() { return 13 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; }
}