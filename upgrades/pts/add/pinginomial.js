const { UpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const formatNumber = require('../../../helpers/formatNumber.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round( 100 * (( 1.5 + ( currentLevel * 0.2 )) ** (currentLevel*0.75)))
    },
    getDetails() {
        return {
            description: "gain the __(level+1)__th number in the fibonacci sequence (1, 2, 3, 5, 8, etc.) as `pts`",
            name: "pinginacci",
            emoji: getEmoji('upgrade_pinginomial', "📈"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "+0" : `+${formatNumber(getFib(level+1), true, 4)}`;
    },
    getEffect(level, context) {
        if (context.state !== PingCalculationStates.SCORING) return {};

        return {
            add: getFib(level+1),
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 4 },
    type() { return UpgradeTypes.ADD_BONUS },
    section() { return PingCalculationStates.SCORING }
}

function getFib(n) {
    const fib = [0, 1];

    for (let i = 2; i <= n; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
    }

    return fib[n];
}