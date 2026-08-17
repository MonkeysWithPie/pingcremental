const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionContextType, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, ContainerBuilder, SeparatorSpacingSize } = require('discord.js');
const { upgrades } = require('./../helpers/upgrades.js')
const database = require('./../helpers/database.js');
const { PipUpgradeTypes } = require('./../helpers/commonEnums.js');
const formatNumber = require('../helpers/formatNumber.js');
const { getEmoji } = require('../helpers/emojis.js');
const { getMultiBuyCost, customMultibuyModalSubmit, parseMultibuySetting } = require('../helpers/multibuy.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ponder')
		.setDescription('Learn to know the limits, and yourself.')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	async execute(interaction) {
        await interaction.reply(await getEditMessage(interaction, PipUpgradeTypes.BONUS, 1));
	},
    buttons: {
        delete: (async interaction => {
            await interaction.update({ content: "(...)", components: [] });
            await interaction.deleteReply(interaction.message);
        }),
        category: (async (interaction, newCategory, buySetting) => {
            await interaction.update(await getEditMessage(interaction, newCategory, parseMultibuySetting(buySetting)));
        }),
        multibuy: (async (interaction, buySetting) => {
            const catButtonRow = interaction.message.components[1];
            const category = catButtonRow.components.find(button => button.style === ButtonStyle.Primary).customId.split('-')[1];

            buySetting = parseMultibuySetting(buySetting);

            await interaction.update(await getEditMessage(interaction, category, buySetting));
        }),
        custommb: (async interaction => {
            const modal = new ModalBuilder()
                .setCustomId('ponder:custommb')
                .setTitle('Custom Multi-Buy Amount')
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel('Upgrade Count')
                        .setDescription('Enter a number or "MAX".')
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Short)
                                .setCustomId('value')
                        )
                );
            await interaction.showModal(modal);
        })
    },
    modals: {
        custommb: (async interaction => {
            const newBuySetting = await customMultibuyModalSubmit(interaction);
            if (newBuySetting === undefined || interaction.replied) return; // already returned

            const catButtonRow = interaction.message.components[1];
            const category = catButtonRow.components.find(button => button.style === ButtonStyle.Primary).customId.split('-')[1];

            return await interaction.update(await getEditMessage(interaction, category, newBuySetting));
        })
    },
    dropdowns: {
        buy: (async (interaction, buySetting) => {
            buySetting = parseMultibuySetting(buySetting);

            const upgradeId = interaction.values[0];
            if (upgradeId === 'none') return await interaction.reply({ content: 'you already got everything.', ephemeral: true });
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);

            let playerUpgradeLevel = playerData.prestigeUpgrades[upgradeId] ?? 0;
            const upgradeClass = upgrades.pip[upgradeId];
            const mbr = getMultiBuyCost(buySetting, upgradeClass, playerData.pip, playerUpgradeLevel);
            const price = mbr.price;
            const levels = mbr.levels;
            
            if (price > playerData.pip) {
                const msg = ['oh.']

                const button = new ButtonBuilder()
                    .setCustomId('ponder:delete')
                    .setLabel(msg[Math.floor(Math.random()*msg.length)])
                    .setStyle(ButtonStyle.Secondary)

                await interaction.update(await getEditMessage(interaction, upgradeClass.type())); // fix dropdown remaining after failed upgrade
                return await interaction.followUp({
                    content: `You can't afford that. (Missing \`${formatNumber(price-playerData.pip, { options: playerData.formatSettings })} PIP\`)`,
                    components: [new ActionRowBuilder().addComponents(button)]
                })
            }

            playerUpgradeLevel += levels;
            playerData.pip -= price;
            playerData.prestigeUpgrades[upgradeId] = playerUpgradeLevel;
            playerData.changed('prestigeUpgrades', true) // this is a hacky way to set the upgrades field, but it works

            // memory-type upgrades give immediate effects so that they apply to the current prestige
            if (upgradeClass.type() === PipUpgradeTypes.KEEP) {
                if (upgradeId === 'memory') {
                    playerData.score += upgradeClass.getEffect(0, {}).special.startPts;
                }
                if (upgradeId === 'remnants') {
                    for (const ptUpgrade of upgradeClass.getEffect(0, {}).special.upgrades) {
                        playerData.upgrades[ptUpgrade] = (playerData.upgrades[ptUpgrade] ?? 0) + 1;
                    }
                    playerData.changed('upgrades', true) // hacky, you know the drill
                }
            }

            await playerData.save();

            const msg = ['alright', 'sure', 'okay', 'uh-huh', 'sure thing'];
            const followupType = playerData.settings.upgradeFollowup;
            const ephemeral = followupType === 'ephemeral' || followupType === 'none' ? MessageFlags.Ephemeral : null;

            const button = new ButtonBuilder()
                .setCustomId('ponder:delete')
                .setLabel(msg[Math.floor(Math.random()*msg.length)])
                .setStyle(ButtonStyle.Success)
            
            await interaction.update(await getEditMessage(interaction, upgradeClass.type(), buySetting));
        
            if (followupType !== 'none') {
                return await interaction.followUp({
                    content: `**${upgradeClass.getDetails().name}** is now level ${playerUpgradeLevel}. (\`${formatNumber(playerData.pip, { options: playerData.formatSettings })} PIP\` left)`,
                    components: [new ActionRowBuilder().addComponents(button)],
                    flags: ephemeral
                })
            }
        })
    }
}

async function getEditMessage(interaction, category, buySetting) {
    const [playerData, ] = await database.Player.findOrCreate({ where: { userId: interaction.user.id }})
    const stats = await playerData.stats();
    if (stats.total.eternities === 0) {
        const button = new ButtonBuilder()
            .setCustomId('ponder:delete')
            .setLabel('oh... okay')
            .setStyle(ButtonStyle.Secondary)
        return {
            content: `*you're out of touch with yourself. maybe something else can help you find the way.*`,
            components: [new ActionRowBuilder().addComponents(button)]
        }
    }

    const categoryRow = new ActionRowBuilder();
    for (const [, cat] of Object.entries(PipUpgradeTypes)) {
        const button = new ButtonBuilder()
            .setCustomId(`ponder:category-${cat}-${buySetting}`)
            .setLabel(cat)
            .setStyle(category === cat ? ButtonStyle.Primary : ButtonStyle.Secondary)
        categoryRow.addComponents(button)
    }

    const pUpgrades = playerData.prestigeUpgrades
    const select = new StringSelectMenuBuilder()
        .setCustomId(`ponder:buy-${buySetting}`)
        .setPlaceholder('pick an upgrade')
    
    const description = `You have **__\`${formatNumber(playerData.pip, { options: playerData.formatSettings })} PIP\`__**. Spend wisely.
You're buying **x${buySetting !== 'MAX' ? formatNumber(buySetting, { options: playerData.formatSettings }) : buySetting}** upgrade${buySetting === 1 ? '' : 's'} at a time.\n`
    
    const container = new ContainerBuilder()
        .setAccentColor(0x162b94)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent("### Ponder \n" + description))
    
    const multiBuys = [1,3,10,'MAX']
    const multiBuyButtons = []
    for (const multiBuy of multiBuys) {
        const button = new ButtonBuilder()
            .setCustomId(`ponder:multibuy-${multiBuy}`)
            .setLabel(`x${multiBuy}`)
            .setStyle(multiBuy === buySetting ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(multiBuy === buySetting)
        multiBuyButtons.push(button)
    }
    multiBuyButtons.push(
        new ButtonBuilder()
            .setCustomId('ponder:custommb')
            .setLabel('custom...')
            .setStyle(ButtonStyle.Secondary)
    )
    container.addActionRowComponents((actionRow) => actionRow.addComponents(multiBuyButtons))
        .addSeparatorComponents((separator) =>
            separator.setSpacing(SeparatorSpacingSize.Small)
        )

    function addToContainer(text) {
        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(text)
        )
    }

    const context = { upgrades: pUpgrades };

    for (const [upgradeId, upgrade] of Object.entries(upgrades.pip)) {
        const upgradeLevel = pUpgrades[upgradeId] ?? 0
        if (upgrade.type() !== category) continue;

        const unlocked = upgrade.unlockRequirements(context);
        if (!unlocked.showable) continue;
        if (!unlocked.buyable) {
            addToContainer(`-# ${getEmoji('locked', '🔒')} locked upgrade | *${unlocked.reason}*`)
            continue;
        }

        if (upgrade.getPrice(upgradeLevel) === null) {
            addToContainer(`**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (MAX)**\n*"${upgrade.getDetails().flavor}"*\n${upgrade.getDetails().description}\nCurrently ${upgrade.getEffectString(upgradeLevel)}`) 
            continue;
        }

        const {price, levels} = getMultiBuyCost(buySetting, upgrade, playerData.pip, upgradeLevel);

        const maxSuffix = upgrade.getMax ? `/${upgrade.getMax()}` : ""
        addToContainer(`\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (Lv${formatNumber(upgradeLevel, { options: playerData.formatSettings })}${maxSuffix})**
*"${upgrade.getDetails().flavor}"*
${upgrade.getDetails().description}
${upgrade.getEffectString(upgradeLevel)} -> ${upgrade.getEffectString(upgradeLevel + levels)} for \`${formatNumber(price, { decimalPlaces: 3, options: playerData.formatSettings })} PIP\``)

        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${upgrade.getDetails().name} | ${formatNumber(price, { options: playerData.formatSettings })} PIP`)
                .setValue(upgradeId)
        )
    }

    if (select.options.length === 0) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('All done here.')
                .setValue('none')
                .setDefault(true)
        )
    }

    container.addActionRowComponents((actionRow) => actionRow.addComponents(select))

    return { embeds: [], components: [container, categoryRow], flags: MessageFlags.IsComponentsV2 }
}