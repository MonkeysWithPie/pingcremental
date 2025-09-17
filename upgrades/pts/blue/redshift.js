const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 250 * (2**currentLevel)
    },
    getDetails() {
        return {
            description: "__-0.3%__ chance to spawn a blue ping (additive), but __x1.08__ all `pts`",
            name: "redshift",
            emoji: getEmoji('upgrade_redshift', "🔴"),
        }
    },
    getEffectString(level) {
        return `-${(0.3*level).toFixed(1)}% chance, x${(1+level*0.08).toFixed(2)} \`pts\``
    },
    getEffect(level, context) {
        return {
            blue: level*-0.3,
            multiply: 1+(level*0.08)
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('blue')
    },
    sortOrder() { return 12 },
    type() { return UpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.RNG_AND_SPECIAL | PingCalculationStates.SCORING; }
}