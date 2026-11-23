const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'mrrow',
        description: 'be the developer of pingcremental',
        flavorText: 'mrrp',
        emoji: getEmoji('badge_mrrow'),
        tier: BADGE_TIERS.PURPLE,
    }
}

module.exports = get;