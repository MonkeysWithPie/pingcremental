const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'hall of mirrors',
        description: 'use 5 or more glimmer clicks at once',
        flavorText: 'light doesn\'t have to deal with entropy, so why should you?',
        emoji: getEmoji('badge_mirrors'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;