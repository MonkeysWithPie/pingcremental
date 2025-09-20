const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: multiplierUnlockRequirements } = require('../multiply/multiplier.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 5) return null; // max of x1.5
        return Math.round(222 * (13**(currentLevel*1.25)));
    },
    getDetails() {
        return {
            description: "gain __x1.1__ `pts` for 1 ping, for every __20__ minutes of non-pinging (up to __144__ pings, or 2d inactive)",
            name: "slumber",
            emoji: getEmoji("upgrade_slumber", "💤"),
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.1).toFixed(1)}, every ${21-level}m, up to ${Math.round((2*24*60)/(21-level))} pings`;
    },
    getEffect(level, context) {
        if (context.state !== PingCalculationStates.SCORING) return;

        let clicks = context.slumberClicks;
        let intervalMs = 1000 * 60 * (21 - level);
        let maxClicks = Math.round((2 * 24 * 60) / (21 - level));
        if (context.specials.superSlumber) {
            intervalMs = 1000 * 60;
            maxClicks = 300;
        }

        const timeSinceLastPing = Date.now() - context.lastPing;

        if (timeSinceLastPing >= intervalMs) {
            const earnedClicks = Math.floor(timeSinceLastPing / intervalMs);
            clicks += earnedClicks;
            clicks = Math.min(clicks, maxClicks);
            clicks = Math.max(clicks, 0);
        }

        if (clicks > 0) {
            return {
                multiply: (1 + (level * 0.1)) * (context.specials.superSlumber ? 15 : 1),
                special: { "slumber": clicks - context.slumberClicks - 1 },
                message: `(${clicks} left)`,
            }
        }
        
        return {}
    },
    unlockRequirements(context) {
        if (!(multiplierUnlockRequirements(context).buyable)) return { showable: false };

        let multiplierLevel = context.upgrades.multiplier || 0;
        if (multiplierLevel < 10) return { showable: true, buyable: false, reason: `'fine, just have a multiplier' ${multiplierLevel}/10` };
        
        return { showable: true, buyable: true };
    },
    sortOrder() { return 107 },
    type() { return UpgradeTypes.MULT_BONUS },
    section() { return PingCalculationStates.SCORING; }
}