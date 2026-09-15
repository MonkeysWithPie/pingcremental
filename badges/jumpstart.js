const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'jumpstart',
        description: 'obtain 100k or more pts in a single ping immediately after any reset',
        flavorText: 'the end is just the start of another end.',
        emoji: getEmoji('badge_jumpstart'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;