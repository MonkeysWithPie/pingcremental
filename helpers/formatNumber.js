function formatNumber(num, shortHand = false, decimalPlaces = 2) {
    if (num === null || num === undefined) return '0'; // handle null or undefined values
    if (!isFinite(num)) return num === Infinity ? 'Infinity' : 'NaN'; // handle special values

    const numStr = num.toString();

    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', // 10^30
                      'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', // 10^60
                      'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', // 10^90
                      'Tg', 'UTg', 'DTg', 'TTg', 'QaTg', 'QiTg', 'SxTg', 'SpTg', 'OcTg', 'NoTg', // 10^120
                      'Qag', 'UQag', 'DQag', 'TQag', 'QaQag', 'QiQag', 'SxQag', 'SpQag', 'OcQag', 'NoQag', // 10^150
                      'Qig', 'UQig', 'DQig', 'TQig', 'QaQig', 'QiQig', 'SxQig', 'SpQig', 'OcQig', 'NoQig', // 10^180
                      'Sxg', 'USxg', 'DSxg', 'TSxg', 'QaSxg', 'QiSxg', 'SxSxg', 'SpSxg', 'OcSxg', 'NoSxg', // 10^210
                      'Spg', 'USpg', 'DSpg', 'TSpg', 'QaSpg', 'QiSpg', 'SxSpg', 'SpSpg', 'OcSpg', 'NoSpg', // 10^240
                      'Ocg', 'UOcg', 'DOcg', 'TOcg', 'QaOcg', 'QiOcg', 'SxOcg', 'SpOcg', 'OcOcg', 'NoOcg', // 10^270
                      'Nog', 'UNog', 'DNog', 'TNog', 'QaNog', 'QiNog', 'SxNog', 'SpNog', 'OcNog', 'NoNog', // 10^300
                      'Ce', 'UCe', 'DCe']; // 10^309

    //get magnitude
    const magnitude = Math.floor(Math.log10(num));

    //if number is above e100 then just use exponent
    if (magnitude >= 100) {
        return num.toExponential(decimalPlaces);
    }

    if (numStr.includes("e")) { 
        const suffixIndex = Math.floor(magnitude / 3);
        const baseNum = (num / Math.pow(10, suffixIndex * 3)).toFixed(decimalPlaces);
        return baseNum + (suffixes[suffixIndex] || '');
    }

    if (numStr.length < 4) return numStr;

    const suffixIndex = Math.floor((numStr.length - 1) / 3);
    if (decimalPlaces >= suffixIndex * 3) {
        decimalPlaces = suffixIndex * 3;
        shortHand = false;
    }

    if (!shortHand) {
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const baseNum = (
        Math.ceil((num * (10 ** (decimalPlaces + 1)) / Math.pow(10, suffixIndex * 3))) /
        (10 ** (decimalPlaces + 1))
    ).toFixed(decimalPlaces);

    return baseNum + suffixes[suffixIndex];
}

module.exports = formatNumber;
