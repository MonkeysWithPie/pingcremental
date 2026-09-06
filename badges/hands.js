const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'heavy hands',
        description: 'ping a total of 10,000 times',
        flavorText: 'with enough repetition, the world bends to your will.',
        emoji: getEmoji('badge_hands'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;