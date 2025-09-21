const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: storageUnlockRequirements } = require('./storage.js');

module.exports = {
    getPrice(currentLevel) {
        return 1000 ** (3 * currentLevel);
    },
    getDetails() {
        return {
            description: "gain __^1.02__ max bp",
            name: "Interstellar Expansion",
            emoji: getEmoji('ponder_expostorage'),
            flavor: "carry the weight of galaxies.",
        }
    },
    getEffectString(level) {
        return `^${(1.02**level).toFixed(3)}`;
    },
    getEffect(level, context) {
        return {
            special: {
                bpStorageExp: 1 + (0.02 * level),
            }
        }
    },
    unlockRequirements(context) {
        if (!(storageUnlockRequirements(context).buyable)) return { showable: false };
        let storageLevel = context.upgrades.storage || 0;
        if (storageLevel < 4) return { showable: true, buyable: false, reason: `'Stellar Strength' ${storageLevel}/4` };
        return { showable: true, buyable: true };

    },
    sortOrder() { return 403 },
    type() { return PipUpgradeTypes.MISC },
    section() { return 0; }
}