const UpgradeTypes = {
    ADD_BONUS: 'addition',
    MULT_BONUS: 'multiplying',
    BLUE_PING: 'blue ping',
    ONE_TIME: 'one time',
    PRESTIGE: 'pingularity',
}
const PipUpgradeTypes = {
    BONUS: 'Increment',
    BLUE_PING: 'Distort',
    MISC: 'Influence',
    KEEP: 'Remember',
    PRESTIGE: 'Repeat',
}

// some upgrades are used in multiple states, so we use bitflags
const PingCalculationStates = {
    RNG_AND_SPECIAL:  0b001,
    SCORING:          0b010,
    POST_SCORING:     0b100,
}

const FabricUpgradeTypes = {
    FLAT_BONUS: 'Flat Bonus',
    BLUE_PING: 'Blue Modification',
    PURE_RANDOM: 'Random Chance',
    SKILL_BASED: 'Skill-Based',
    MISC: 'Miscellaneous',
}   

Object.freeze(UpgradeTypes);
Object.freeze(PipUpgradeTypes);
Object.freeze(FabricUpgradeTypes);
Object.freeze(PingCalculationStates);

module.exports = { UpgradeTypes, PipUpgradeTypes, FabricUpgradeTypes, PingCalculationStates };