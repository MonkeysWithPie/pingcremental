const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'lucky',
        description: 'discover a rare ping',
        flavorText: 'the chances are low, but never quite zero.',
        emoji: getEmoji('badge_lucky'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;