const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'awesome sauce :horse:',
        description: 'awesome sauce :horse:',
        flavorText: 'awesome sauce :horse:',
        emoji: getEmoji('badge_awesome_sauce'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;