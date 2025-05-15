function formatNumber(num, shortHand = false, decimalPlaces = 2, display = 0) { 
    /*
    ok this commit shouldn't be pulled till you add a settings command
    you also need to add this new flag to. every instance of formatNumber used..
    new flag alert!! display flag, this will do a few things
    if display is 0, it will display the numbers as how they are currently. so using shortened prefixes till e100
    if display is 1, it will display the numbers with the full name, until e100.
    if display is 2, it will just use scientific notation for all numbers
    */
    
    if (num === null || num === undefined) return '0'; // handle null or undefined values
    if (!isFinite(num)) return num === Infinity ? 'Infinity' : 'NaN'; // handle special values

    const numStr = num.toString();

    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', // 10^30
                      'Dc', 'Ud', 'Dd', 'Td', 'Qtd', 'Qd', 'Sxd', 'Spd', 'Od', 'Nd', // 10^60
                      'Vg', 'Uvg', 'Dvg', 'Trv', 'Qtv', 'Qiv', 'Sxv', 'Spv', 'Ocv', // 10^87
                      'Ndv', 'Tg', 'Utg', 'Dtg'];  // 10^99

    const fullSuffixes = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', // 10^18
                          'Sextillion', 'Septillion', 'Octillion', 'Nonillion', // 10^30
                          'Decillion', 'Undecillion', 'Duodecillion', 'Tredecillion', // 10^42
                          'Quattuordecillion', 'Quindecillion', 'Sexdecillion', 'Septendecillion', 'Octodecillion', 'Novemdecillion', // 10^60
                          'Vigintillion', 'Unvigintillion', 'Duovigintillion', 'Trevigintillion', 'Quattuorvigintillion', // 10^75
                          'Quinvigintillion', 'Sexvigintillion', 'Septenvigintillion', 'Octovigintillion', // 10^87
                          'Novemvigintillion', 'Trigintillion', 'Untrigintillion', 'Duotrigintillion'];  // 10^99

    // get magnitude
    const magnitude = Math.floor(Math.log10(num));
    const suffixIndex = Math.floor(magnitude / 3);

    // if display mode is 2 or number is above e100 then just use exponent
    if (display === 2 || magnitude >= 100) {
        //get rid of the + because it looks dumb
        const parts = num.toExponential(decimalPlaces).split('e');
        const exponent = parts[1].replace('+', '');
        return `${parts[0]}e${exponent}`;
    }

    if (numStr.length < 4) return numStr; // if less than 4 digits, return as is

    if (decimalPlaces >= suffixIndex * 3) {
        decimalPlaces = suffixIndex * 3;
        shortHand = false;
    }

    if (!shortHand) {
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); //return with commas if not shorthand
    }

    //format base number, before adding suffix
    const baseNum = (
        Math.ceil((num * (10 ** (decimalPlaces + 1)) / Math.pow(10, suffixIndex * 3))) /
        (10 ** (decimalPlaces + 1))
    ).toFixed(decimalPlaces);

    //if display is 1, use full name instead of shortened suffix
    if (display === 1) {
        return baseNum + ' ' + (fullSuffixes[suffixIndex] || '');
    }

    // default to short suffix (display === 0)
    return baseNum + (suffixes[suffixIndex] || '');
}

module.exports = formatNumber;
