const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 3) return null;
        return Math.round(8.5**(currentLevel+1) * 325);
    },
    getDetails() {
        return {
            description: "start gaining `bp` before unlocking pingularity",
            name: "Foresight",
            emoji: getEmoji('ponder_foresight', "🔮"),
            flavor: "know before you go.",
        }
    },
    getEffectString(level) {
        if (level === 0) return "+0 bp"
        return `+${(level*0.5 + 0.5).toFixed(1)} bp`
    },
    getEffect(level, context) {
        return {
            bp: level*0.5 + 0.5
        }
    },
    upgradeRequirements() {
        return { hoard: 2 };
    },
    sortOrder() { return 405 }, // upgrade IS found (i'm not using 404 to spite you)
    type() { return PipUpgradeTypes.PRESTIGE }
}