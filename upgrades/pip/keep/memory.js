const { PipUpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(2500 * ((currentLevel+1)**1.1))
    },
    getDetails() {
        return {
            description: "start with __10,000__ `pts`",
            name: "Distant Memories",
            emoji: getEmoji('ponder_memory', "🧠"),
            flavor: "your past isn't worthless. don't forget it.",
        }
    },
    getEffectString(level) {
        return `${level*10}K \`pts\``
    },
    getEffect(level, context) {
        return {
            special: {
                startPts: 10000,
            },
        }
    },
    unlockRequirements(context) {
        if (!context.upgrades.beginning) return { showable: true, buyable: false, reason: "buy 'Eternity\'s Welcome'" };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 301 },
    type() { return PipUpgradeTypes.KEEP },
    section() { return 0; }
}