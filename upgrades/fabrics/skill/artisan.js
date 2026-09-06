const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

const artisanSymbols = ["✿", "✦", "⁂"]

const lastClickedSymbolCache = {}
const bonusCache = {}
const comboCache = {}

module.exports = {
    getPrice() {
        return 124;
    },
    getDetails() {
        return {
            description: 
`creates 2 additional ping buttons, each with a unique symbol attached to it.
clicking grants a scaling bonus as no mistakes are made, up to **^1.15** (at 50 clicks in a row).
clicking the same symbol twice in a row will result in a **^0.7** debuff, and resets the bonus to nothing.`,
            name: "Fabric of the Artisan",
            emoji: "✒️",
        }
    },
    getEffect(_level, context) {
        if (context.state === PingCalculationStates.RNG_AND_SPECIAL) return { special: { artisan: true } };
        if (!context.artisanClickedSymbol) return { special: { artisan: true } };

        let exponent = 1;
        
        let combo = (comboCache[context.user.id] || 0) + 1;

        if (context.artisanClickedSymbol && context.artisanClickedSymbol === lastClickedSymbolCache[context.user.id]) {
            exponent = 0.7;
            
            bonusCache[context.user.id] = 1;
            comboCache[context.user.id] = 0;
            combo = 0;
        } else if (context.artisanClickedSymbol && lastClickedSymbolCache[context.user.id]) {
            exponent = Math.min((bonusCache[context.user.id] || 1) + (0.15 / 50), 1.15);

            if (context.state === PingCalculationStates.NON_REPEAT_FINISH) {
                bonusCache[context.user.id] = exponent;
                comboCache[context.user.id] = combo;
            }
        }

        if (context.state === PingCalculationStates.NON_REPEAT_FINISH) {
            lastClickedSymbolCache[context.user.id] = context.artisanClickedSymbol;
        }

        return {
            exponent: exponent,
            special: {
                artisan: true,
                artisanCombo: combo,
            },
            message: `(${context.artisanClickedSymbol || "?"}${combo ? ` x${combo}` : ""})`,
        }
    },
    type() { return FabricUpgradeTypes.SKILL_BASED },
    isUnique() { return true; },
    artisanSymbols,
    section() { return PingCalculationStates.SCORING | PingCalculationStates.RNG_AND_SPECIAL | PingCalculationStates.NON_REPEAT_FINISH; }
}