const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 3)**3) + 1212;
    },
    getDetails() {
        return {
            description: "flip a coin until you land on heads, and gain __+10%__ (additive) pts for every tails you land on",
            name: "Eternal Coinflip",
            emoji: getEmoji('ponder_coinflip', "🪙"),
            flavor: "the coin has been flipping endlessly from the moment it was tossed.", // this is a phigros reference!
        }
    },
    getEffectString(level) {
        return `${(level*10)}%`
    },
    getEffect(level, context) {
        let heads = false;
        let tails = 0;
        let mult = 1;

        // hard cap tails to 99 to prevent infinite loops and rediculous multipliers
        while (!heads && tails < 99) {
            heads = Math.random() < (0.5 / context.RNGmult);
            if (!heads) {
                mult += (level * 0.1);
                tails++;
            }
        }

        if (tails > 0) {
            return {
                multiply: mult,
                message: `${tails} tails`,
            }
        }
        return {};
    },
    upgradeRequirements() {
        return { favored: 1 };
    },
    sortOrder() { return 5 },
    type() { return PipUpgradeTypes.BONUS }
}