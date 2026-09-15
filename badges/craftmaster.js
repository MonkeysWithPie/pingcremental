const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'craftmaster',
        description: 'reach an artisan combo of 250',
        flavorText: 'the motions of your craft become habitual, and time once again moves quickly.',
        emoji: getEmoji('badge_craftmaster'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;