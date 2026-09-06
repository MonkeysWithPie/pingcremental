const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

module.exports = {
    getPrice() {
        return 69;
    },
    getDetails() {
        return {
            description: 
`gives a permanent **x0.9** pts debuff.
1 in 3000 to gain **^1.6** pts.`,
            name: "Fragile Fabric",
            emoji: "🪶", 
        }
    },
    getEffect(level) {
        let roll;
        let hits = 0;
        
        for (let i = 0; i < level; i++) {
            roll = Math.floor(Math.random() * 3000);
            if (roll === 0) {
                hits++;
            }
        }

        if (hits > 0) {
            return {
                exponent: 1.6 ** hits,
                message: `***__A ${['', 'BRILLIANT ', 'LEGENDARY ', 'GODLIKE '][hits]}SURGE OF POWER!__***`
            }
        }

        return {
            multiply: 0.9,
        }
    },
    type() { return FabricUpgradeTypes.PURE_RANDOM },
    isUnique() { return false; },
    section() { return PingCalculationStates.SCORING; }
}