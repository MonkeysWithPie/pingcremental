const { BADGE_TIERS } = require('../helpers/badgeUtils.js');
const { getEmoji } = require('../helpers/emojis.js');

function get() {
    return {
        name: 'programmer',
        description: 'contribute to the github repository (<https://github.com/MonkeysWithPie/pingcremental>)',
        flavorText: 'comprehension of the godly workings.',
        emoji: getEmoji('badge_coder'),
        tier: BADGE_TIERS.BLUE,
    }
}

module.exports = get;