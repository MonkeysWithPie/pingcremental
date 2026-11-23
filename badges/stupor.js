const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'blue stupor',
        description: 'find a blue ping streak of 10 or more',
        flavorText: 'now look what you\'ve done. it\'s all blue, all the way down.',
        emoji: getEmoji('badge_stupor'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;