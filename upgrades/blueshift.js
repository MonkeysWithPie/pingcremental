const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return 500 * (2**currentLevel)
    },
    getDetails() {
        return {
            description: "__+0.6%__ chance to spawn a blue ping (additive)",
            name: "blueshift",
            emoji: "<:upgrade_blueshift:1361881329712758935>",
        }
    },
    getEffectString(level) {
        return `+${(0.6*level).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            blue: level*0.6
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('blue')
    },
    sortOrder() { return 11 },
    type() { return UpgradeTypes.BLUE_PING }
}