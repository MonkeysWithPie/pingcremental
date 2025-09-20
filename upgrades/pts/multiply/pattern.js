const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: luckyUnlockRequirements } = require('../once/lucky.js');

function getMultiplier(level) {
    let mult = 1 + (level * 0.11);
    if (level >= 10) {
        mult += 0.01 * Math.floor(level / 9); // always make last 2 digits the same
    }

    return mult
}

module.exports = {
    getPrice(currentLevel) {
        let origPrice = 888 * (2.6**(currentLevel)) // split for sake of being readable
        return Math.round(origPrice/1000)*1000 + 888
    },
    getDetails() {
        return {
            description: "gain __x1.11__ `pts` when last two digits of ping are the same",
            name: "pattern recognition",
            emoji: getEmoji('upgrade_pattern', "🔍"),
        }
    },
    getEffectString(level) {
        return `x${getMultiplier(level).toFixed(2)}`
    },
    getEffect(level, context) {
        const pString = `${context.ping}`
        return {
            multiply: (pString[pString.length - 1] === pString[pString.length - 2]) ? getMultiplier(level) : 1,
        }
    },
    unlockRequirements(context) {
        if (!(luckyUnlockRequirements(context).buyable)) return { showable: false };
        if (!context.upgrades.lucky) return { showable: true, buyable: false, reason: "buy 'lucky number 7'" };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 102 },
    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; }
}