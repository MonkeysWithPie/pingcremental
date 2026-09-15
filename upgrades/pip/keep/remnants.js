const { PipUpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: memoryUnlockRequirements } = require('./memory.js');

module.exports = {
    getPrice(currentLevel) {
        return 10**(currentLevel+2) + 1111;
    },
    getDetails() {
        return {
            description: "start with __+1__ level of various upgrades",
            name: "Remnants",
            emoji: getEmoji('ponder_remnants', "🗿"),
            flavor: "preserve the past as you would the future.",
        }
    },
    getEffectString(level) {
        return `lv${level}`
    },
    getEffect() {
        return {
            special: {
                upgrades: ['slow','usability','multiplier','blueshift','pipiping',]
            }
        }
    },
    unlockRequirements(context) {
        if (!(memoryUnlockRequirements(context).buyable)) return { showable: false };
        const memoryLevel = context.upgrades.memory || 0;
        if (memoryLevel < 2) return { showable: true, buyable: false, reason: `'Distant Memories' ${memoryLevel}/2` };
        
        return { showable: true, buyable: true };
    },
    sortOrder() { return 302 },
    type() { return PipUpgradeTypes.KEEP },
    section() { return 0; }
}