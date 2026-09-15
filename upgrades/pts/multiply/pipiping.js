const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 30) return null; // 30% max
        return Math.round(350 * (1.35**currentLevel))
    },
    getDetails() {
        return {
            description: "__+1%__ (additive) chance to get x3 `pts`",
            name: "pipiping",
            emoji: getEmoji('upgrade_pipiping', "🔁"),
        }
    },
    getEffectString(level) {
        return `${level}%`
    },
    getEffect(level) {
        return {
            multiply: Math.random()*1000 <= (level*10) ? 3 : undefined,
        }
    },
    unlockRequirements() {
        return { showable: true, buyable: true };
    },
    sortOrder() { return 5 },

    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; },
    getMax() { return 30; }
}