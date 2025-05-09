const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1200 * (3**currentLevel)) + 1523;
    },
    getDetails() {
        return {
            description: "an additional 5% of your Glimmer clicks are used per click, gain __x1.15__ pts (multiplicative) for each",
            name: "Refract",
            emoji: getEmoji('ponder_refract', "☀️"),
            flavor: "'i can see the light!' - someone long forgotten",
        }
    },
    getEffectString(level) {
        return `${((level*0.15)+1).toFixed(2)}x each`
    },
    getEffect(level, context) {
        if (!context.glimmerClicks) return {};
        if (context.isSuper) return {};

        const extraGlimmer = Math.floor(context.glimmerClicks * 0.05);
        const mult = (level*0.15+1) ** extraGlimmer;

        if (mult === 1) return {};
        return {
            special: {
                "glimmer": -extraGlimmer
            },
            multiply: mult,
            message: `(used ${extraGlimmer} extra)`
        }
    },
    upgradeRequirements() {
        return { indigo: 3 };
    },
    sortOrder() { return 106 },
    type() { return PipUpgradeTypes.BLUE_PING }
}