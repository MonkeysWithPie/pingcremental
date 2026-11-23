const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'interwoven',
        description: 'tear the universe for the first time',
        flavorText: 'you must meld reality to your will.',
        emoji: getEmoji('badge_interwoven'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;