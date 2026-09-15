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
    STATIC_SPECIAL:    0b00001,
    RNG_AND_SPECIAL:   0b00010,
    SCORING:           0b00100,
    POST_SCORING:      0b01000,
    NON_REPEAT_FINISH: 0b10000,
}

const FabricUpgradeTypes = {
    FLAT_BONUS: 'Flat Bonus',
    BLUE_PING: 'Blue Modification',
    PURE_RANDOM: 'Random Chance',
    SKILL_BASED: 'Skill-Based',
    MISC: 'Miscellaneous',
}

// sort by earliest to latest activation! e.g. tears after eternity b/c tears also reset eternity
const PrestigeLayers = [
    "eternity", 
    "tear", 
    "total"
]

Object.freeze(UpgradeTypes);
Object.freeze(PipUpgradeTypes);
Object.freeze(FabricUpgradeTypes);
Object.freeze(PingCalculationStates);

module.exports = { UpgradeTypes, PipUpgradeTypes, FabricUpgradeTypes, PingCalculationStates, PrestigeLayers };