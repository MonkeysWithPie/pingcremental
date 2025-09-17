const BADGE_TIERS = {
    SILVER: 1,
    BLUE: 2,
    PURPLE: 3,
};

let allBadgesCache = null;

function getAllBadges() {
    if (allBadgesCache) return allBadgesCache;

    const badges = [];
    const badgeFiles = require('fs').readdirSync('./badges').filter(f => f.endsWith('.js'));
    for (const file of badgeFiles) {
        const badgeObj = require(`../badges/${file}`)();
        badges.push(badgeObj);
    }
    allBadgesCache = badges;

    return badges;
}

function getBadgeByName(name) {
    const allBadges = getAllBadges();
    const badgeObj = allBadges.find(b => b.name.toLowerCase() === name.toLowerCase() || (b.aliases && b.aliases.map(a => a.toLowerCase()).includes(name.toLowerCase())));
    if (!badgeObj) {
        console.warn(`[WARN] tried to get badge ${name} but it doesn't exist`);
        return null;
    }
    return badgeObj;
}
function getBadgesByName(...names) {
    const badges = []
    for (const name of names) {
        badges.push(getBadgeByName(name));
    }

    return badges;
}

module.exports = { getBadgeByName, getBadgesByName, getAllBadges, BADGE_TIERS };