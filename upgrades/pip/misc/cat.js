const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 7007 : null;
    },
    getDetails() {
        return {
            description: "does some stuff, sometimes",
            name: "cat?",
            emoji: getEmoji('ponder_cat', "🐱"),
            flavor: "what the hell is this guy doing here?",
        }
    },
    getEffectString(level) {
        return level > 0 ? "cat :D" : "no cat D:"
    },
    getEffect(level, context) {
        const roll = Math.random()*3;

        if (roll < 1.8) {
            return {
                add: 5 + Math.floor(Math.random()*5),
                message: "mrrow!"
            }
        } else if (roll < 2.7) {
            return {
                multiply: 1.2 + Math.random()*0.5,
                message: "mrrp!",
            }
        } else {
            return {
                exponent: 1.1,
                message: "purrrr!",
            }
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 203 },
    type() { return PipUpgradeTypes.MISC }
}