const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

const artisanSymbols = ["✿", "✦", "⁂"]

let lastClickedSymbolCache = {}
let bonusCache = {}
let comboCache = {}

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
        if (context.state !== PingCalculationStates.SCORING) return { special: { artisan: true } };
        if (!context.artisanClickedSymbol) return { special: { artisan: true } };

        let exponent = 1;
        
        if (context.artisanClickedSymbol && context.artisanClickedSymbol === lastClickedSymbolCache[context.user.id]) {
            exponent = 0.7;

            bonusCache[context.user.id] = 1;
            comboCache[context.user.id] = 0;
        } else if (context.artisanClickedSymbol && lastClickedSymbolCache[context.user.id]) {
            bonusCache[context.user.id] = Math.min((bonusCache[context.user.id] || 1) + (0.15 / 50), 1.15);
            comboCache[context.user.id] = (comboCache[context.user.id] || 0) + 1;

            exponent = bonusCache[context.user.id];
        }

        lastClickedSymbolCache[context.user.id] = context.artisanClickedSymbol;

        return {
            exponent: exponent,
            special: {
                artisan: true,
                artisanCombo: comboCache[context.user.id] || 0,
            },
            message: `(${context.artisanClickedSymbol || "?"}${comboCache[context.user.id] ? ` x${comboCache[context.user.id]}` : ""})`,
        }
    },
    type() { return FabricUpgradeTypes.SKILL_BASED },
    isUnique() { return true; },
    artisanSymbols,
    section() { return PingCalculationStates.SCORING | PingCalculationStates.RNG_AND_SPECIAL; }
}