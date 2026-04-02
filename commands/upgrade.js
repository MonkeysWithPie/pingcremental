const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, InteractionContextType, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { upgrades, rawUpgrades } = require('./../helpers/upgrades.js')
const { getEmbeddedCommand } = require('./../helpers/embedCommand.js');
const database = require('./../helpers/database.js');
const { UpgradeTypes } = require('./../helpers/commonEnums.js');
const awardBadge = require('../helpers/awardBadge.js');
const formatNumber = require('./../helpers/formatNumber.js');
const { getTearRequirement } = require('./weave.js');
const { getEmoji } = require('../helpers/emojis.js');
const { getBuySetting, getMultiBuyCost, customMultibuyModalSubmit } = require('../helpers/multibuy.js');

function getEternityPip(playerProfile) {
    let gainedPip = playerProfile.bp;
    if (playerProfile.prestigeUpgrades.telepathy) {
        gainedPip *= rawUpgrades.telepathy.getEffect(playerProfile.prestigeUpgrades.telepathy).special.pipMult;
    }
    if (playerProfile.equippedFabrics.eternityFab) {
        gainedPip *= rawUpgrades.eternityFab.getEffect(playerProfile.equippedFabrics.eternityFab).special.pipMult;
    }
    return Math.floor(gainedPip);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upgrade')
        .setDescription('get stronger pings')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply(await getEditMessage(interaction, UpgradeTypes.ADD_BONUS, 1));
    },
    buttons: {
        delete: (async interaction => {
            await interaction.update({ content: "(bye!)", components: [] });
            await interaction.deleteReply(interaction.message);
        }),
        category: (async (interaction, newCategory) => {
            await interaction.update(await getEditMessage(interaction, newCategory, getBuySetting(interaction)));
        }),
        eternity: (async interaction => {
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);
            const firstEternity = playerData.pip === 0;

            // add removed upgrade levels, for "vague" upgrade
            let removed = 0;
            for (const [, level] of Object.entries(playerData.upgrades)) {
                removed += level;
            }
            playerData.removedUpgrades += removed;

            const gainedPip = getEternityPip(playerData);

            playerData.upgrades = {};
            playerData.score = 0;
            playerData.clicks = 0;
            playerData.glimmerClicks = 0;
            playerData.slumberClicks = 0;

            playerData.pip += gainedPip;
            playerData.totalPip += gainedPip;
            playerData.bp = 0;
            playerData.eternities++;
            playerData.totalEternities++;

            // memory effects
            if (playerData.prestigeUpgrades.memory) {
                playerData.score += (10000 * playerData.prestigeUpgrades.memory);
            }
            if (playerData.prestigeUpgrades.remnants) {
                for (const ptUpgrade of upgrades.pip.remnants.getEffect(playerData.prestigeUpgrades.remnants).special.upgrades) {
                    playerData.upgrades[ptUpgrade] = playerData.prestigeUpgrades.remnants;
                }
            }
            
            playerData.changed('upgrades', true) 

            await playerData.save();
            await interaction.update({ content: `*it is done.*\n-# you gained __\`${formatNumber(gainedPip)} PIP\`__, so you now have __\`${formatNumber(playerData.pip)} PIP\`__`, components: [] });
            if (firstEternity) {
                await interaction.followUp({ content: `
*welcome to Eternity. congratulations on making it here.*
*i suppose you're wondering why you would even want to be here.*
*Eternity brings you the ability to look within yourself, to see your flaws and strengths and to exploit them.*
*good luck, pinger.*
${getEmbeddedCommand("ponder")}`, flags: MessageFlags.Ephemeral });
                await awardBadge(interaction.user.id, 'foreverbound', interaction.client);
            }

            if (playerData.tears < 1 && getTearRequirement(playerData.tears) === playerData.eternities) {
                await interaction.followUp({
                    content: 
`*you've been looking for something more, haven't you...?*
*there may not be much more eternity can give you, but there's always another way to obtain power.*
*heed the universe's call. tear it apart and weave it anew.*
*${getEmbeddedCommand("weave")}*`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // minimum 1 because of pingularity
            if (removed <= 1) {
                await awardBadge(interaction.user.id, 'purity', interaction.client);
                await interaction.followUp({ content: "*you've brought yourself back to eternity... without your earthly possessions. impressive.*", flags: MessageFlags.Ephemeral });
            }
        }),
        multibuy: (async (interaction, buySetting) => {
            const catButtonRow = interaction.message.components[0];
            const category = catButtonRow.components.find(button => button.style === ButtonStyle.Primary).customId.split('-')[1];

            if (buySetting === 'MAX') {
                buySetting = 'MAX';
            } else {
                buySetting = parseInt(buySetting);
            }

            await interaction.update(await getEditMessage(interaction, category, buySetting));
        }),
        custommb: (async interaction => {
            const modal = new ModalBuilder()
                .setCustomId('upgrade:custommb')
                .setTitle('custom multi-buy')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('value')
                            .setLabel('upgrade amount')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('enter a number or "MAX"...')
                    )
                );
            await interaction.showModal(modal);
        })
    },
    dropdowns: {
        buy: (async interaction => {
            const upgradeId = interaction.values[0];
            if (upgradeId === 'none') return await interaction.reply({ content: 'you already got everything!', flags: MessageFlags.Ephemeral });
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);
            let buySetting = getBuySetting(interaction);
            const displaySetting = buySetting;
            if (buySetting < 1 && buySetting !== 'MAX') buySetting = 1;

            const playerUpgradeLevel = playerData.upgrades[upgradeId] ?? 0;
            const upgradeClass = upgrades.pts[upgradeId];
            let price = 1;
            let levels = 1;

            let ephemeral = playerData.settings.upgradeFollowup === 'ephemeral' || playerData.settings.upgradeFollowup === 'none' ? MessageFlags.Ephemeral : null;

            // skip multi-buy on eternity so it doesn't pointlessly loop millions of times
            if (upgradeId !== 'eternity') {
                const mbr = getMultiBuyCost(buySetting, upgradeClass, playerData.score, playerUpgradeLevel);
                price = mbr.price;
                levels = mbr.levels;
            }
            

            // player is poor (L)
            if (price > playerData.score) {
                const msg = ['dang!', 'oops!', 'awh!', 'ack!', 'sad!']

                const button = new ButtonBuilder()
                    .setCustomId('upgrade:delete')
                    .setLabel(msg[Math.floor(Math.random() * msg.length)]) // random sad message
                    .setStyle(ButtonStyle.Secondary)

                await interaction.update(await getEditMessage(interaction, upgradeClass.type(), displaySetting)); // fix dropdown remaining after failed upgrade
                return await interaction.followUp({
                    content: `you dont have enough \`pts\` to afford that! (missing \`${formatNumber(price - playerData.score, true)} pts\`)`,
                    components: [new ActionRowBuilder().addComponents(button)],
                    flags: ephemeral
                })
            }

            if (upgradeId === 'eternity') {
                await interaction.update(await getEditMessage(interaction, upgradeClass.type(), displaySetting)); 
                if (playerData.bp < 10000) { return await interaction.followUp({ content: `*you shouldn't be here, yet.*`, flags: MessageFlags.Ephemeral }) }
                return await interaction.followUp({
                    content: 
`*Eternity calls for you, but you must make sure you're ready.*
***are you?***
-# this will **reset** your current upgrades, \`pts\`, and clicks and give you __${formatNumber(getEternityPip(playerData))} PIP__ from your __\`${formatNumber(playerData.bp)} BP\`__.`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('upgrade:eternity')
                                .setLabel('i\'m ready.')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('upgrade:delete')
                                .setLabel('wait, no')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    ]
                })
            }

            // update player data
            playerData.score -= price;
            playerData.upgrades[upgradeId] = playerUpgradeLevel + levels;
            playerData.changed('upgrades', true) // this is a hacky way to set the upgrades field, but it works
            await playerData.save();
            let followupType = playerData.settings.upgradeFollowup;

            if (levels >= 50 && upgradeId !== 'stars') {
                await awardBadge(interaction.user.id, 'seal the deal', interaction.client);
            }

            const msg = ['sweet!', 'nice!', 'sick!', 'cool!', 'neat!', 'nifty!', 'yippee!', 'awesome!'];
            let pickedMsg = msg[Math.floor(Math.random() * msg.length)];
            if (pickedMsg === 'awesome!' && Math.random() < 0.001) {
                pickedMsg = 'awesome sauce 🐴';
                await awardBadge(interaction.user.id, 'awesome sauce :horse:', interaction.client);

                // force regular followup since it's rare
                followupType = 'regular';
                ephemeral = null;
            }

            const button = new ButtonBuilder()
                .setCustomId('upgrade:delete')
                .setLabel(pickedMsg) // random happy message
                .setStyle(ButtonStyle.Success)

            await interaction.update(await getEditMessage(interaction, upgradeClass.type(), displaySetting));

            if (followupType !== 'none') {
                return await interaction.followUp({
                    content: `upgraded **${upgradeClass.getDetails().name}** to level ${playerUpgradeLevel + levels}! you have \`${formatNumber(playerData.score, true, 4)} pts\` left.`,
                    components: [new ActionRowBuilder().addComponents(button)],
                    flags: ephemeral
                })
            }
            
        })
    },
    modals: {
        custommb: (async interaction => {
            const newBuySetting = await customMultibuyModalSubmit(interaction);
            if (newBuySetting === undefined || interaction.replied) return; // already returned

            const catButtonRow = interaction.message.components[0];
            const category = catButtonRow.components.find(button => button.style === ButtonStyle.Primary).customId.split('-')[1];

            return await interaction.update(await getEditMessage(interaction, category, newBuySetting));
        }),
    }
}

async function getEditMessage(interaction, category, buySetting) {
    const [playerData, ] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })
    if (playerData.totalClicks < 150 && !playerData.clicks >= 150) { // prevent upgrading before 150 clicks
        const button = new ButtonBuilder()
            .setCustomId('upgrade:delete')
            .setLabel('oh... okay')
            .setStyle(ButtonStyle.Secondary)
        return {
            content: `*upgrades? what upgrades? you should go back to pinging.*\n-# (${playerData.clicks}/150)`,
            components: [new ActionRowBuilder().addComponents(button)]
        }
    }

    const buttonRow = new ActionRowBuilder();
    // loop through all upgrade categories and add buttons for each one
    for (const [, cat] of Object.entries(UpgradeTypes)) {
        if (cat === UpgradeTypes.PRESTIGE && !playerData.upgrades?.pingularity) continue; // prevent seing prestige tab before unlock
        const button = new ButtonBuilder()
            .setCustomId(`upgrade:category-${cat}`)
            .setLabel(cat)
            .setStyle(category === cat ? ButtonStyle.Primary : ButtonStyle.Secondary)
        buttonRow.addComponents(button)
    }

    const pUpgrades = playerData.upgrades

    const select = new StringSelectMenuBuilder()
        .setCustomId('upgrade:buy')
        .setPlaceholder('pick an upgrade')
    let description = `you have **__\`${formatNumber(playerData.score, true, 4)} pts\`__** to spend...\nbuying **x${buySetting}** upgrade${buySetting === 1 ? '' : 's'} per click...\n`
    const embed = new EmbedBuilder()
        .setTitle("upgrades")
        .setColor("#73c9ae")

    const multiBuys = [1,5,25,'MAX']
    const multiBuyButtons = []
    for (const multiBuy of multiBuys) {
        const button = new ButtonBuilder()
            .setCustomId(`upgrade:multibuy-${multiBuy}`)
            .setLabel(`x${multiBuy}`)
            .setStyle(multiBuy === buySetting ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(multiBuy === buySetting)
        multiBuyButtons.push(button)
    }
    multiBuyButtons.push(
        new ButtonBuilder()
            .setCustomId('upgrade:custommb')
            .setLabel('custom...')
            .setStyle(ButtonStyle.Secondary)
    )
    const multiBuyRow = new ActionRowBuilder()
        .addComponents(multiBuyButtons)

    // still display as <= 1 but act as 1
    if (parseInt(buySetting) < 1 && buySetting !== 'MAX') {
        buySetting = 1;
    }

    const context = { upgrades: pUpgrades, clicks: playerData.clicks, totalClicks: playerData.totalClicks, bp: playerData.bp, fabrics: playerData.equippedFabrics };

    for (const [upgradeId, upgrade] of Object.entries(upgrades.pts)) {
        // go through each upgrade and check if should be displayed
        const upgradeLevel = pUpgrades[upgradeId] ?? 0
        if (upgrade.type() !== category) continue; // wrong category
        
        const unlocked = upgrade.unlockRequirements(context);
        if (!unlocked.showable) continue; // hidden
        if (!unlocked.buyable) {
            description += `\n-# ${getEmoji('locked', '🔒')} locked upgrade | *${unlocked.reason}*`
            continue;
        }
        if (upgrade.getPrice(upgradeLevel) === null) { // maxed out
            description += `\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (MAX)**\n${upgrade.getDetails().description}\nCurrently ${upgrade.getEffectString(upgradeLevel)}`
            continue;
        }
        
        const {price, levels} = getMultiBuyCost(buySetting, upgrade, playerData.score, upgradeLevel);

        description += `\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (Lv${formatNumber(upgradeLevel, true, 6)})**
${upgrade.getDetails().description}
${upgrade.getEffectString(upgradeLevel)} -> ${upgrade.getEffectString(upgradeLevel + levels)} for \`${formatNumber(price, true)} pts\`${levels > 1 ? ` (*${formatNumber(levels, true)} levels*)` : ''}`

        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${upgrade.getDetails().name} | ${formatNumber(price, true)} pts`)
                .setValue(upgradeId)
        )
    }

    // add a default option if there are no options
    if (select.options.length === 0) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('upgrades are maxed!')
                .setValue('none')
                .setDefault(true)
        )
    }

    embed.setDescription(description)
    return { embeds: [embed], components: [buttonRow, multiBuyRow, new ActionRowBuilder().addComponents(select)] }
}
