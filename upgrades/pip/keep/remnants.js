const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return 12**(currentLevel+2) + 1111;
    },
    getDetails() {
        return {
            description: "start with __+1__ level of various upgrades",
            name: "Remnants",
            emoji: getEmoji('ponder_remnants', "🗿"),
            flavor: "preserve the past as you would the future.",
        }
    },
    getEffectString(level) {
        return `lv${level}`
    },
    getEffect(level, context) {
        return {
            special: {
                upgrades: ['slow','usability','multiplier','blueshift','pipiping',]
            }
        }
    },
    upgradeRequirements() {
        return { memory: 2 };
    },
    sortOrder() { return 302 },
    type() { return PipUpgradeTypes.KEEP }
}