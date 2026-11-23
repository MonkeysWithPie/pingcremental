const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 144;
    },
    getDetails() {
        return {
            description: 
`gain **1** APT per 2 minutes not pinging, up to a maximum of **600** (20 hours) without claiming.`,
            name: "APT Magnet Fabric", // this does mean APT is canonically metal
            emoji: "🧲",
        }
    }, 
    getEffect(level, context) {
        if (context.autopinging) return {};

        const timeSinceLastPing = Date.now() - context.lastPing;
        const aptGain = Math.min(Math.floor(timeSinceLastPing / (2 * 60 * 1000)), 600);
        
        return {
            apt: aptGain * level
        };
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return false; },
    section() { return PingCalculationStates.POST_SCORING; },
}