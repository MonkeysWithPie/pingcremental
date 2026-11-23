const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'artist',
        description: 'create emojis or icons that become officially used',
        flavorText: 'paint the void, the void will further your created beauty.',
        emoji: getEmoji('badge_artist'),
        tier: BADGE_TIERS.BLUE,
    }
}

module.exports = get;