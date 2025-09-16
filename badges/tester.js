const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'tester',
        description: 'test the bot before full release, and give useful feedback',
        flavorText: 'standing in the havoc before peace was made.',
        emoji: getEmoji('badge_tester'),
        tier: BADGE_TIERS.BLUE,
    }
}

module.exports = get;