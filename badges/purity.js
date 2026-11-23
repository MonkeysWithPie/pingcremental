const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'purity',
        description: 'reach Eternity without buying any regular upgrades',
        flavorText: 'forgo your earthly possessions and prove yourself to the world.',
        emoji: getEmoji('badge_purity'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;