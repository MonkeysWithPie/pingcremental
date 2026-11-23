const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel === 0) return 1000
        return null;
    },
    getDetails() {
        return {
            description: "1% chance (35% cap) of spawning a blue ping that grants 15x `pts`",
            name: "blue ping",
            emoji: getEmoji('upgrade_blue', "🟦"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "not discoverable" : "discoverable"
    },
    getEffect() {
        return {
            special: { "blueping" : true },
            blue: 1,
        };
    },
    unlockRequirements() {
        return { showable: true, buyable: true };
    },
    sortOrder() { return 10 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL; },
    getMax() { return 1; }
}