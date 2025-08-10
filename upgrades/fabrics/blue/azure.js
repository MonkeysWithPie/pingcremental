const { FabricUpgradeTypes } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 58;
    },
    getDetails() {
        return {
            description: 
`increases the blue ping chance cap by **15%**.`,
            name: "Azure Fabric",
            emoji: "🧿",
        }
    },
    getEffect(level, context) {
        return {
            blueCap: 15 * level,
        }
    },
    type() { return FabricUpgradeTypes.BLUE_PING },
    isUnique() { return false; }
}