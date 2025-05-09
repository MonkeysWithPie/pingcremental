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

Object.freeze(UpgradeTypes);
Object.freeze(PipUpgradeTypes);

module.exports = { UpgradeTypes, PipUpgradeTypes };