const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'broken infinity',
        description: 'obtain Infinity pts in one way or another',
        flavorText: 'crack through reality itself and need nothing else.',
        emoji: getEmoji('badge_break_infinity'),
        tier: BADGE_TIERS.PURPLE,
    }
}

module.exports = get;