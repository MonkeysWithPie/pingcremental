const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: luckyUnlockRequirements } = require('./lucky.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 8125 : null
    },
    getDetails() {
        return {
            description: "gain x0.85 to x1.25 `pts`, or x0.7 to x1.5 if you roll a 1 or 20",
            name: "actually roll a d20",
            emoji: getEmoji('upgrade_d20', "🎲"),
        }
    },  
    getEffectString(level) {
        return level === 1 ? "d20" : "d0"
    },
    getEffect(level, context) {
        const rollCount = (context.specials.extraDice || 0) + 1;

        let roll = 0
        for (let i = 0; i < rollCount; i++) {
            roll = Math.max(Math.floor(Math.random() * 20) + 1, roll);
            if (roll === 20) break;
        }

        let mult = (roll/50) + 0.85;

        if (roll === 1) mult = 0.7;
        if (roll === 20) mult = 1.5;

        return {
            multiply: mult,
        }
    },
    unlockRequirements(context) {
        if (!(luckyUnlockRequirements(context).buyable)) return { showable: false };
        const totalClicks = context.stats.total.clicks;

        const req1 = context.upgrades.lucky
        const req2 = totalClicks >= 500

        if (!req1 && !req2) return { showable: true, buyable: false, reason: `buy 'lucky number 7', ${totalClicks}/500 clicks` };
        if (!req1) return { showable: true, buyable: false, reason: `buy 'lucky number 7'` };
        if (!req2) return { showable: true, buyable: false, reason: `${totalClicks}/500 clicks` };

        return { showable: true, buyable: true };
    },
    sortOrder() { return 103 },
    type() { return UpgradeTypes.ONE_TIME },
    section() { return PingCalculationStates.SCORING }
}