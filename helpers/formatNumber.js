const Notations = require("@antimatter-dimensions/notations")

const TEMP_REPLACEMENT = "—";

function formatNumber(num, { decimalPlaces = 2, shortHand = true, shortHandPlaces = 0, options = {
    swapCommas: false,
    formatMode: "standard",
} } = {}) {
    if (num === null || num === undefined) return '0'; // handle null or undefined values
    if (!isFinite(num)) return num === Infinity ? 'Infinity' : 'NaN'; // handle special values

    const magnitude = Math.floor(Math.log10(num)) + 1;

    // e.g. 1,000 with 4 decimals doesn't get rounded to 1.000k, instead being 1,000
    if (magnitude <= decimalPlaces || !shortHand) {
        const integerPart = Math.floor(num);
        const decimalPart = num - integerPart;
        if (decimalPart < 1e-6) {
            return integerPart.toLocaleString().replace(",", options.swapCommas ? "." : ",");
        }

        const roundedDecimal = decimalPart.toFixed(shortHand ? decimalPlaces - magnitude : shortHandPlaces).slice(2);

        return integerPart.toLocaleString().replace(",", options.swapCommas ? "." : ",") 
            + (roundedDecimal ? (options.swapCommas ? "," : ".") + roundedDecimal : "");
    }

    let notation;
    switch (options.formatMode) {
        case "scientific":
            notation = new Notations.ScientificNotation();
            break;
        
        case "engineering":
            notation = new Notations.EngineeringNotation();
            break;
        
        case "letters":
            notation = new Notations.LettersNotation();
            break;
        
        case "standard":
        default:
            notation = new Notations.StandardNotation();
    }

    let formatted = notation.format(num, decimalPlaces)
        .replace(" ", ""); // remove space before suffix

    if (options.swapCommas) {
        formatted = formatted
            .replace(",", TEMP_REPLACEMENT)
            .replace(".", ",")
            .replace(TEMP_REPLACEMENT, ".");
    }

    return formatted;
}

module.exports = formatNumber;
