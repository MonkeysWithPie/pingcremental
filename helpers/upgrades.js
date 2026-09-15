const fs = require('fs');
const path = require('path');

const upgradeFolderPath = path.join(__dirname, '../upgrades');
const upgradeCurrencyFolders = fs.readdirSync(upgradeFolderPath);
const list = {}; // list of all upgrades

for (const folder of upgradeCurrencyFolders) {
    list[folder] = {}; // Initialize the folder in the list

    const upgradeCurrencyFolderPath = path.join(upgradeFolderPath, folder);
    const upgradeCurrencyFolders = fs.readdirSync(upgradeCurrencyFolderPath).filter(file => fs.statSync(path.join(upgradeCurrencyFolderPath, file)).isDirectory());

    for (const currencyFolders of upgradeCurrencyFolders) {
        const upgradeFolderPath = path.join(upgradeCurrencyFolderPath, currencyFolders);
        const upgradeFiles = fs.readdirSync(upgradeFolderPath).filter(file => file.endsWith('.js'));

        for (const file of upgradeFiles) {
            const filePath = path.join(upgradeFolderPath, file);
            list[folder][file.replace('.js', '')] = require(filePath);
        }
    }
}

const sortedList = {}; // sorted list of all upgrades
for (const folder of Object.keys(list)) {
    sortedList[folder] = {}; // Initialize the folder in the sorted list
    sortedList[folder] = Object.entries(list[folder])
        .sort(([, a], [, b]) => {
            if (!a.sortOrder || !b.sortOrder) { // some upgrades (e.g. fabrics) don't sort
                return 0;
            }

            return a.sortOrder() - b.sortOrder()
        })
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
}

const rawUpgrades = {}; // raw list of all upgrades
for (const folder of Object.keys(list)) {
    for (const upgrade of Object.keys(list[folder])) {
        rawUpgrades[upgrade] = list[folder][upgrade];
    }
}

for (const upgrade of Object.values(rawUpgrades)) {
    if (upgrade.getPrice(1) === upgrade.getPrice(0)) continue;
    if (upgrade.getMax) {
        upgrade.theoreticalMax = upgrade.getMax();
        continue
    };
    let level = 1;
    let exp = 0;
    let upperLimitHit = false;

    while (true) {
        const price = upgrade.getPrice(level)
        const priceInvalid = price === null || price === Infinity
        if (priceInvalid) {
            if (price === null && exp === 0) level++;
            if (exp === 0) break;
            upperLimitHit = true;
        };

        if (upperLimitHit && exp !== 0) exp--;
        else if (!upperLimitHit) exp++;

        const oldLevel = level;
        if (!upperLimitHit) {
            level = 2 ** exp
        } else if (priceInvalid) {
            level -= 2 ** exp
        } else {
            level += 2 ** exp
        }
        if (level === oldLevel) break;
    }

    upgrade.theoreticalMax = level - 1;
}

module.exports = { upgrades: sortedList, rawUpgrades };