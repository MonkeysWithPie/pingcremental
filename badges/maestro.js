const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'maestro',
        description: 'reach an orchestra combo of 100',
        flavorText: 'the beat of the music continues in your heart.',
        emoji: getEmoji('badge_maestro'),
        tier: BADGE_TIERS.SILVER,
    }
}

module.exports = get;