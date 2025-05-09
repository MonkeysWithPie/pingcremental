const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { upgrades } = require('./../helpers/upgrades.js')
const database = require('./../helpers/database.js');
const { PipUpgradeTypes } = require('./../helpers/upgradeEnums.js');
const formatNumber = require('../helpers/formatNumber.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ponder')
		.setDescription('Learn to know the limits, and yourself.')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	async execute(interaction) {
        await interaction.reply(await getEditMessage(interaction, PipUpgradeTypes.BONUS));
	},
    buttons: {
        delete: (async interaction => {
            await interaction.update({ content: "(...)", components: [] });
            await interaction.deleteReply(interaction.message);
        }),
        category: (async (interaction, newCategory) => {
            await interaction.update(await getEditMessage(interaction, newCategory));
        }),
    },
    dropdowns: {
        buy: (async interaction => {
            const upgradeId = interaction.values[0];
            if (upgradeId === 'none') return await interaction.reply({ content: 'you already got everything.', ephemeral: true });
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);

            let playerUpgradeLevel = playerData.prestigeUpgrades[upgradeId] ?? 0;
            const upgradeClass = upgrades['pip'][upgradeId];
            const price = upgradeClass.getPrice(playerUpgradeLevel);
            
            if (price > playerData.pip) {
                const msg = ['oh.']

                const button = new ButtonBuilder()
                    .setCustomId('ponder:delete')
                    .setLabel(msg[Math.floor(Math.random()*msg.length)])
                    .setStyle(ButtonStyle.Secondary)

                await interaction.update(await getEditMessage(interaction, upgradeClass.type())); // fix dropdown remaining after failed upgrade
                return await interaction.followUp({
                    content: `You can't afford that. (Missing \`${formatNumber(price-playerData.pip)} PIP\`)`,
                    components: [new ActionRowBuilder().addComponents(button)]
                })
            }

            playerUpgradeLevel += 1;
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

            const button = new ButtonBuilder()
                .setCustomId('ponder:delete')
                .setLabel(msg[Math.floor(Math.random()*msg.length)])
                .setStyle(ButtonStyle.Success)
            
            await interaction.update(await getEditMessage(interaction, upgradeClass.type()));

            let unlockMessage = "";
            for (const [checkedUpgradeId, checkedUpgrade] of Object.entries(upgrades['pip'])) {
                const req = checkedUpgrade.upgradeRequirements();

                if (playerData.prestigeUpgrades[checkedUpgradeId]) continue; // already unlocked
                if (!req[upgradeId]) continue; // doesn't require newly unlocked upgrade
                if (req[upgradeId] > playerUpgradeLevel) continue; // not yet

                let newlyUnlocked = true;
                for (const [requiredUpgrade, requiredLevel] of Object.entries(req)) {
                    if (requiredLevel < (playerData.prestigeUpgrades[requiredUpgrade] ?? 0)) {
                        newlyUnlocked = false;
                        break;
                    };
                }
                if (!newlyUnlocked) continue;

                unlockMessage += `\n**${checkedUpgrade.getDetails().emoji} ${checkedUpgrade.getDetails().name}**\n${checkedUpgrade.getDetails().description}`
            }
            if (unlockMessage !== "") {
                unlockMessage = "\nYou also unlocked:\n" + unlockMessage;
            }

            return await interaction.followUp({
                content: `**${upgradeClass.getDetails().name}** is now level ${playerUpgradeLevel}. (\`${formatNumber(playerData.pip)} PIP\` left)${unlockMessage}`,
                components: [new ActionRowBuilder().addComponents(button)]
            })
        })
    }
}

async function getEditMessage(interaction, category) {
    
    const [playerData, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id }})
    if (!playerData.prestigeUpgrades.beginning && !playerData.pip) {
        const button = new ButtonBuilder()
            .setCustomId('ponder:delete')
            .setLabel('oh... okay')
            .setStyle(ButtonStyle.Secondary)
        return {
            content: `*you're out of touch with yourself. maybe something else can help you find the way.*`,
            components: [new ActionRowBuilder().addComponents(button)]
        }
    }

    const buttonRow = new ActionRowBuilder();
    for (const [_key, cat] of Object.entries(PipUpgradeTypes)) {
        const button = new ButtonBuilder()
            .setCustomId(`ponder:category-${cat}`)
            .setLabel(cat)
            .setStyle(category === cat ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(category === cat)
        buttonRow.addComponents(button)
    }

    const pUpgrades = playerData.prestigeUpgrades
    const select = new StringSelectMenuBuilder()
        .setCustomId('ponder:buy')
        .setPlaceholder('pick an upgrade')
    let description = `You have **__\`${formatNumber(playerData.pip)} PIP\`__**. Spend wisely.`
    const embed = new EmbedBuilder()
        .setTitle("Ponder")
        .setColor("#162b94")

    for (const [upgradeId, upgrade] of Object.entries(upgrades['pip'])) {
        const upgradeLevel = pUpgrades[upgradeId] ?? 0
        if (upgrade.type() != category) continue;

        let canBuy = true;
        for (const [requiredUpgrade, requiredLevel] of Object.entries(upgrade.upgradeRequirements())) {
            canBuy = !(pUpgrades[requiredUpgrade] === undefined || pUpgrades[requiredUpgrade] < requiredLevel) && canBuy; // check if upgrade is unlocked
        }
        if (!canBuy) continue;

        if (upgrade.getPrice(upgradeLevel) === null) {
            description += `\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (MAX)**\n*"${upgrade.getDetails().flavor}"*\n${upgrade.getDetails().description}\nCurrently ${upgrade.getEffectString(upgradeLevel)}` 
            continue;
        }

        description += `\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (Lv${upgradeLevel})**
*"${upgrade.getDetails().flavor}"*
${upgrade.getDetails().description}
${upgrade.getEffectString(upgradeLevel)} -> ${upgrade.getEffectString(upgradeLevel+1)} for \`${formatNumber(upgrade.getPrice(upgradeLevel))} PIP\`` 

        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${upgrade.getDetails().name} | ${upgrade.getPrice(upgradeLevel)} PIP`)
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


    embed.setDescription(description)

    return { embeds: [embed], components: [buttonRow, new ActionRowBuilder().addComponents(select)] }
}