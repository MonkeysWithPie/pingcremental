const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: slowUnlockRequirements } = require('../add/slow.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(80 * (1.1**(currentLevel)))
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
    unlockRequirements(context) {
        if (!(slowUnlockRequirements(context).buyable)) return { showable: false };

        let slowLevel = context.upgrades.slow || 0;
        if (slowLevel < 3) return { showable: true, buyable: false, reason: `'slow internet' ${slowLevel}/3` };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 2 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING; },
}