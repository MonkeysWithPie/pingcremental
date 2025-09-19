const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

let recentPingTimes = {}
let nextPingLeniency = []
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

        let tempList = recentPingTimes[context.user.id].slice();
        const timeSinceLast = context.interactionTimestamp - (tempList[0] || 0);
        const length = tempList.unshift(context.interactionTimestamp);

        if (length < 5) {
            if (context.state === PingCalculationStates.NON_REPEAT_FINISH) { recentPingTimes[context.user.id] = tempList; }
            return {
                message: `keep the rhythm... (${length}/5)`,
            }
        }
        if (length > 15) {
            tempList.pop();
        }


        const intervals = [];
        for (let i = 0; i < Math.min(length - 1, 10); i++) {
            intervals.push(tempList[i] - tempList[i + 1]);
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
            if (nextPingLeniency[context.user.id]) {
                distFromTarget = COMBO_WINDOW;
                if (context.state === PingCalculationStates.NON_REPEAT_FINISH) nextPingLeniency[context.user.id] = false;
            }

            else {
                bonusCache[context.user.id] = 1;
                comboCache[context.user.id] = 0;
                if (distFromTarget < 0) {
                    msg += `EARLY...`;
                } else {
                    msg += `LATE...`;
                }
            }
        }

        if (Math.abs(distFromTarget) >= COMBO_WINDOW * 2) {
            tempList = [];
        }

        if (distFromTarget > 0 && Math.abs(distFromTarget) < COMBO_WINDOW && Math.abs(distFromTarget) > NOTELESS_WINDOW) {
            msg += `L`
        } else if (distFromTarget < 0 && Math.abs(distFromTarget) < COMBO_WINDOW && Math.abs(distFromTarget) > NOTELESS_WINDOW) {
            msg += `E`
        }

        let exp = 1;

        if (Math.abs(distFromTarget) < PERFECT_WINDOW) {
            exp = addBonus(context.user.id, 1.2 / 100, context.state);
            msg += `perfect!`;
        } else if (Math.abs(distFromTarget) < GREAT_WINDOW) {
            exp = addBonus(context.user.id, 0.5 / 100, context.state);
            msg += `great!`;
        } else if (Math.abs(distFromTarget) <= COMBO_WINDOW) {
            exp = addBonus(context.user.id, 0, context.state); // only maintains combo
            msg += `okay!`;
        }

        if (context.state === PingCalculationStates.NON_REPEAT_FINISH) {
            recentPingTimes[context.user.id] = tempList;
            if (context.rare) nextPingLeniency[context.user.id] = true;
        }

        let combo = (comboCache[context.user.id] || 0) + 1;

        return {
            exponent: exp,
            message: `${msg} (x${combo})`,
            special: {
                orchestraCombo: combo,
            }
        }
    },
    type() { return FabricUpgradeTypes.SKILL_BASED },
    isUnique() { return true; },
    section() { return PingCalculationStates.SCORING | PingCalculationStates.NON_REPEAT_FINISH; }
}

function addBonus(userId, amount, state) {
    if (!bonusCache[userId]) {
        bonusCache[userId] = 1;
    }
    let exp = Math.min(bonusCache[userId] + amount, 1.15);
    if (state !== PingCalculationStates.NON_REPEAT_FINISH) {
        return exp;
    }

    bonusCache[userId] = Math.min(bonusCache[userId] + amount, 1.15);
    comboCache[userId] = (comboCache[userId] || 0) + 1;
    return exp;
}