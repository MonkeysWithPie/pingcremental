const { MessageFlags } = require("discord.js");

function getMultiBuyCost(buySetting, upgrade, score, playerUpgradeLevel) {
    let price = 0;
    let levels = 0;

    if (buySetting === 'MAX') {
        levels = 0;

        // loop through all levels that are affordable
        do {
            price += upgrade.getPrice(playerUpgradeLevel + levels);
            levels++;
        } while (price <= score && upgrade.getPrice(playerUpgradeLevel + levels) !== null && price !== Infinity && levels < 1e6);

        // remove the last level that was too expensive (sometimes doesn't happen due to level maxes)
        if (levels > 1 && price > score) {
            levels--;
            price -= upgrade.getPrice(playerUpgradeLevel + levels);
        }
    } else {
        for (let i = 0; i < buySetting && i < 1e6; i++) {
            const p = upgrade.getPrice(playerUpgradeLevel + i);
            if (p === null || p + price === Infinity) break; // maxed out
            levels++;
            price += upgrade.getPrice(playerUpgradeLevel + i);
        }
    }

    return { price, levels }
}

async function customMultibuyModalSubmit(interaction) {
    let newBuySetting = interaction.fields.getTextInputValue('value');

    if (newBuySetting !== 'MAX' && isNaN(parseInt(newBuySetting))) {
        return await interaction.reply({ content: 'invalid multi-buy amount! must be a number or "MAX"', flags: MessageFlags.Ephemeral });
    }
    if (parseInt(newBuySetting) >= 1e6) {
        return await interaction.reply({ content: 'that\'s a bit too much for me to do... try something lower than a million?', flags: MessageFlags.Ephemeral });
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