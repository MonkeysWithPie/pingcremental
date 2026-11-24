const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'threadbare',
        description: 'tear the universe whilst only getting 10 thread or less from bonuses',
        flavorText: 'was it really worth leaving with nothing?',
        emoji: getEmoji('badge_threadbare'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;