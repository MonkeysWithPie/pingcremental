const { PipUpgradeTypes } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: storageUnlockRequirements } = require('./storage.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(2500 * (3.5**currentLevel));
    },
    getDetails() {
        return {
            description: "gain __x1.25__ PIP",
            name: "Telepathy",
            emoji: getEmoji('ponder_telepathy', "🧠"),
            flavor: "know your thoughts before you even think them.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.25) + 1).toFixed(2)}`
    },
    getEffect(level) {
        return {
            special: {
                pipMult: ((level ? level : 0)*0.25) + 1,
            },
        }
    },
    unlockRequirements(context) {
        if (!(storageUnlockRequirements(context).buyable)) return { showable: false };
        const storageLevel = context.upgrades.storage || 0;
        if (storageLevel < 2) return { showable: true, buyable: false, reason: `'Stellar Strength' ${storageLevel}/2` };
        return { showable: true, buyable: true };
    },
    sortOrder() { return 402 },
    type() { return PipUpgradeTypes.PRESTIGE },
    section() { return 0; }
}