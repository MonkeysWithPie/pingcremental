const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1200 * (3**currentLevel)) + 1523;
    },
    getDetails() {
        return {
            description: "an additional 5% of your Glimmer clicks (up to 20) are used per click, gain __x1.2__ pts (additive) for each",
            name: "Refract",
            emoji: getEmoji('ponder_refract', "☀️"),
            flavor: "'i can see the light!' - someone long forgotten",
        }
    },
    getEffectString(level) {
        return `${((level*0.2)+1).toFixed(1)}x each`
    },
    getEffect(level, context) {
        if (!context.glimmerClicks) return {};
        if (context.isSuper) return {};

        const extraGlimmer = Math.min(Math.floor(context.glimmerClicks * 0.05),20);
        const mult = (level * 0.2 * extraGlimmer) + 1;

        if (mult === 1) return {};
        return {
            special: {
                "glimmer": -(extraGlimmer + 1) // +1 due to the base glimmer click
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