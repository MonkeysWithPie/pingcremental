const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

let recentPingTimes = {}
let bonusCache = {}
let comboCache = {}

const COMBO_WINDOW = 300;
const GREAT_WINDOW = 150;
const PERFECT_WINDOW = 80;
const NOTELESS_WINDOW = 60;

module.exports = {
    getPrice() {
        return 150;
    },
    getDetails() {
        return {
            description:
`clicking in a rhythm will grant a scaling bonus up to **^1.15**.
clicking too far off rhythm will break the combo. 
skipping one beat is okay, but more will break the combo.`,
            name: "Fabric of the Orchestra",
            emoji: "🎶",
        }
    },
    getEffect(_level, context) {
        if (context.autopinging) return {};

        if (!context.interactionTimestamp) return {};
        if (!recentPingTimes[context.user.id]) {
            recentPingTimes[context.user.id] = [];
        }

        let msg = "";

        const timeSinceLast = context.interactionTimestamp - (recentPingTimes[context.user.id][0] || 0);
        const length = recentPingTimes[context.user.id].unshift(context.interactionTimestamp);

        if (length < 5) {
            return {
                message: `keep the rhythm... (${length}/5)`,
            }
        }
        if (length > 15) {
            recentPingTimes[context.user.id].pop();
        }


        const intervals = [];
        for (let i = 0; i < Math.min(length - 1, 10); i++) {
            intervals.push(recentPingTimes[context.user.id][i] - recentPingTimes[context.user.id][i + 1]);
        }
        
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals.length % 2 === 0
            ? (intervals[intervals.length / 2 - 1] + intervals[intervals.length / 2]) / 2
            : intervals[Math.floor(intervals.length / 2)];
        
        const targetTime = medianInterval;
        let distFromTarget = timeSinceLast - targetTime;
        
        if (Math.abs(distFromTarget - targetTime) < Math.abs(distFromTarget)) {
            // skipped a beat, probably
            distFromTarget -= targetTime;
            msg += "SK"
        }

        if (Math.abs(distFromTarget) > COMBO_WINDOW) {
            bonusCache[context.user.id] = 1;
            comboCache[context.user.id] = 0;
            if (distFromTarget < 0) {
                msg += `EARLY...`;
            } else {
                msg += `LATE...`;
            }
        }

        if (Math.abs(distFromTarget) >= COMBO_WINDOW * 2) {
            recentPingTimes[context.user.id] = [];
        }

        if (distFromTarget > 0 && Math.abs(distFromTarget) < COMBO_WINDOW && Math.abs(distFromTarget) > NOTELESS_WINDOW) {
            msg += `L`
        } else if (distFromTarget < 0 && Math.abs(distFromTarget) < COMBO_WINDOW && Math.abs(distFromTarget) > NOTELESS_WINDOW) {
            msg += `E`
        }

        if (Math.abs(distFromTarget) < PERFECT_WINDOW) {
            addBonus(context.user.id, 1.2 / 100);
            msg += `perfect!`;
        } else if (Math.abs(distFromTarget) < GREAT_WINDOW) {
            addBonus(context.user.id, 0.5 / 100);
            msg += `great!`;
        } else if (Math.abs(distFromTarget) <= COMBO_WINDOW) {
            addBonus(context.user.id, 0); // only maintains combo
            msg += `okay!`;
        }

        return {
            exponent: bonusCache[context.user.id],
            message: `${msg} (x${comboCache[context.user.id]})`,
            special: {
                orchestraCombo: comboCache[context.user.id] || 0,
            }
        }
    },
    type() { return FabricUpgradeTypes.SKILL_BASED },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING; }
}

function addBonus(userId, amount) {
    if (!bonusCache[userId]) {
        bonusCache[userId] = 1;
    }
    bonusCache[userId] = Math.min(bonusCache[userId] + amount, 1.15);
    comboCache[userId] = (comboCache[userId] || 0) + 1;
}