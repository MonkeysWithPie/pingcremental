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
        const roll = Math.random();

        if (roll < 0.5) {
            return {
                add: 10 + Math.floor(Math.random()*15),
                message: "mrrow!"
            }
        } else if (roll < 0.8) {
            return {
                multiply: 1.2 + Math.random()*0.5,
                message: "mrrp!",
            }
        } else {
            return {
                blue: 100,
                special: { blueCap: 100 },
                message: "`forced blue!` purrrr!",
            }
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 203 },
    type() { return PipUpgradeTypes.MISC }
}