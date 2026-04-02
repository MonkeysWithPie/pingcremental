const { PipUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');
const { unlockRequirements: indigoUnlockRequirements } = require('./indigo.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1200 * (3**currentLevel)) + 1523;
    },
    getDetails() {
        return {
            description: "an additional 5% of your Glimmer clicks (up to 20) are used per click, gain __x1.25__ `pts` (additive) for each",
            name: "Refract",
            emoji: getEmoji('ponder_refract', "☀️"),
            flavor: "'i can see the light!' - someone long forgotten",
        }
    },
    getEffectString(level) {
        return `${((level*0.25)+1).toFixed(2)}x each`
    },
    getEffect(level, context) {
        if (!context.glimmerClicks) return {};
        if (context.isSuper) return {};

        const extraGlimmer = Math.min(Math.floor(context.glimmerClicks * 0.05),20);
        const mult = (level * 0.25 * extraGlimmer) + 1;

        if (mult === 1) return {};
        return {
            special: {
                "glimmer": (context.specials.glimmer || 0) - extraGlimmer
            },
            multiply: mult,
            message: `(used ${extraGlimmer} extra)`
        }
    },
    unlockRequirements(context) {
        if (!(indigoUnlockRequirements(context).buyable)) return { showable: false };
        const indigoLevel = context.upgrades.indigo || 0;
        if (indigoLevel < 3) return { showable: true, buyable: false, reason: `'Indigo Vision' ${indigoLevel}/3` };
        
        return { showable: true, buyable: true };
    },
    sortOrder() { return 105 },
    type() { return PipUpgradeTypes.BLUE_PING },
    section() { return PingCalculationStates.SCORING; }
}