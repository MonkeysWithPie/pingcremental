const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'foreverbound',
        description: 'reach Eternity',
        flavorText: 'all you know is the bottom of the hierarchy. take this knowledge in stride, and continue forth.',
        emoji: getEmoji('badge_foreverbound'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;