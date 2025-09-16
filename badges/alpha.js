const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'og',
        description: 'play the bot before Eternity (1.0.0) was released',
        flavorText: "'back in my day...'",
        emoji: getEmoji('badge_og'),
        tier: BADGE_TIERS.BLUE,
    }
}

module.exports = get;