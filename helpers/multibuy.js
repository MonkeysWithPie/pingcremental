const { MessageFlags } = require("discord.js");

const REASONABLE_OOM_THRESHOLD = 6;

function getMultiBuyCost(buySetting, upgrade, score, playerUpgradeLevel) {
    let price = 0;
    let levels = 0;

    if (buySetting === 'MAX') {
        // fallback for upgrades that have a low level, since algorithm below is better
        // for upgrades with high caps
        if (upgrade.theoreticalMax < 50) {
            while (price <= score) {
                const upgradePrice = upgrade.getPrice(playerUpgradeLevel + levels);
                if (upgradePrice === null || upgradePrice + price === Infinity) break;
                price += upgradePrice
                levels++;
            }

            return { price, levels }
        }

        // TODO: improve logic here when i'm less tired
        let exp = 0;
        let upperLimitHit = false;

        // find a starting level (for large counts of pts)
        while (true) {
            price = upgrade.getPrice(levels)
            const priceTooHigh = Math.log10(score) - Math.log10(price) < REASONABLE_OOM_THRESHOLD;
            const priceInvalid = price === null || price === Infinity || priceTooHigh
            if (priceInvalid) {
                if (exp === 0) break;
                upperLimitHit = true;
            };

            if (upperLimitHit && exp !== 0) exp--;
            else if (!upperLimitHit) exp++;

            const oldLevel = levels;
            if (!upperLimitHit) {
                levels = 2 ** exp
            } else if (priceInvalid) {
                levels -= 2 ** exp
            } else {
                levels += 2 ** exp
            }
            if (levels === oldLevel) break;
        }
        levels--;
        price = upgrade.getPrice(levels)
        if (playerUpgradeLevel + levels > upgrade.theoreticalMax) {
            levels = upgrade.theoreticalMax - playerUpgradeLevel;
        }

        // loop through all levels that are affordable
        while (price <= score) {
            const upgradePrice = upgrade.getPrice(playerUpgradeLevel + levels);
            if (upgradePrice === null || upgradePrice + price === Infinity) break;
            price += upgradePrice
            levels++;
        }

        // remove the last level that was too expensive (sometimes doesn't happen due to level maxes)
        if (levels > 1 && price > score) {
            levels--;
            price -= upgrade.getPrice(playerUpgradeLevel + levels);
        }
    } 
    else {
        let validHighestLevel;
        if (playerUpgradeLevel + buySetting > upgrade.theoreticalMax) {
            buySetting = upgrade.theoreticalMax - playerUpgradeLevel;
        }

        for (let i = buySetting; i > 0; i--) {
            const levelPrice = upgrade.getPrice(playerUpgradeLevel + i - 1);
            if (levelPrice === null || levelPrice === Infinity) continue;
            if (validHighestLevel === undefined) validHighestLevel = i;

            if (levelPrice + price === Infinity) {
                price -= upgrade.getPrice(playerUpgradeLevel + validHighestLevel);
                levels--;
                validHighestLevel--;
                i++; // (do this iteration again)
                continue;
            }
            
            if (Math.log10(price) - Math.log10(levelPrice) > REASONABLE_OOM_THRESHOLD && price > 0) {
                // price at this level and below is pretty much inconsequential,
                // so permit buying all the levels at this point
                levels = validHighestLevel;
                break;
            }
            levels++;

            price += levelPrice;
        }
    }

    return { price, levels }
}

async function customMultibuyModalSubmit(interaction) {
    let newBuySetting = interaction.fields.getTextInputValue('value');

    if (newBuySetting !== 'MAX' && isNaN(parseInt(newBuySetting))) {
        return await interaction.reply({ content: 'invalid multi-buy amount! must be a number or "MAX"', flags: MessageFlags.Ephemeral });
    }
    if (parseInt(newBuySetting) < 0) {
        return await interaction.reply({ content: 'you can\'t sell upgrades, sorry!', flags: MessageFlags.Ephemeral });
    }

    if (newBuySetting === 'MAX') {
        newBuySetting = 'MAX';
    } else {
        newBuySetting = parseInt(newBuySetting);
    }
    return newBuySetting;
}

function parseMultibuySetting(buySetting) {
    if (buySetting === 'MAX') {
        return 'MAX';
    }

    if (isNaN(parseInt(buySetting))) {
        return 1;
    }
    
    return parseInt(buySetting);
}

module.exports = { getMultiBuyCost, customMultibuyModalSubmit, parseMultibuySetting }