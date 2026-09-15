const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'seal the deal',
        description: 'buy 50 or more levels of an upgrade at once (except "beyond the stars")',
        flavorText: 'everything you could ever ask for, all in one little package. :seal:',
        emoji: getEmoji('badge_deal'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;