const { FabricUpgradeTypes } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 83;
    },
    getDetails() {
        return {
            description: 
`unlocks 4 new \`pts\` upgrades, marked with "[🛍️]".
-# these upgrades won't work if you don't have this fabric equipped.`,
            name: "Shopkeeper's Fabric",
            emoji: "🛍️",
        }
    },
    getEffect(_level, context) {
        return {
            special: {
                allowShopkeeperUpgrades: true,
            }
        };
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return true; }
}