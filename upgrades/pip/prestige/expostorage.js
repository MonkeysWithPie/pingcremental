const { PipUpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: storageUnlockRequirements } = require('./storage.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(200 ** ((1.5 * currentLevel) + 1));
    },
    getDetails() {
        return {
            description: "gain __^1.06__ max bp",
            name: "Interstellar Expansion",
            emoji: getEmoji('ponder_expostorage', "🌌"),
            flavor: "carry the weight of galaxies.",
        }
    },
    getEffectString(level) {
        return `^${((level*0.06) + 1).toFixed(2)}`;
    },
    getEffect(level) {
        return {
            special: {
                bpStorageExp: 1 + (0.06 * level),
            }
        }
    },
    unlockRequirements(context) {
        if (!(storageUnlockRequirements(context).buyable)) return { showable: false };
        const storageLevel = context.upgrades.storage || 0;
        if (storageLevel < 4) return { showable: true, buyable: false, reason: `'Stellar Strength' ${storageLevel}/4` };
        return { showable: true, buyable: true };

    },
    sortOrder() { return 403 },
    type() { return PipUpgradeTypes.PRESTIGE },
    section() { return 0; }
}