const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'beta tester',
        description: 'tested the public beta version of the bot and gave useful feedback on a major update',
        flavorText: 'proposing new ways to fix everything that is broken.',
        emoji: getEmoji('badge_tester'),
        tier: BADGE_TIERS.BLUE,
    }
}

module.exports = get;