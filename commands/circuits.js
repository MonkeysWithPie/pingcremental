const { SlashCommandBuilder, MessageFlags, InteractionContextType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder } = require("discord.js");
const database = require("../helpers/database");
const formatNumber = require("../helpers/formatNumber");

const CIRCUIT_TAB = {
    Buy: "assemble",
    Allocate: "solder",
    Edit: "adjust",
    Milestones: "milestones",
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('circuits')
        .setDescription('automate upgrades and the like')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply(await getResponse(interaction))
    },
    buttons: {
        delete: async (interaction) => {
            await interaction.update({ content: "(zip!)", components: [] });
            await interaction.deleteReply(interaction.message);
        },
        section: async (interaction, newTab) => {
            await interaction.update(await getResponse(interaction, newTab))
        },
        buy: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const stats = await player.stats()
            const price = getCircuitBoardCost(stats.total.circuits);

            if (player.apt < price) {
                return await interaction.reply({
                    content: "you don't have enough APT. i know it's hard not to spend it all right away but you have to save up for these things",
                    flags: MessageFlags.Ephemeral
                })
            }

            player.circuits += 1;
            player.increaseStat("circuits", 1);
            player.apt -= price;
            await player.save();

            await interaction.update(await getResponse(interaction));
            await interaction.followUp({
                content: `you bought a circuit for ${price} APT!`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("circuits:delete")
                        .setLabel("sweet!")
                        .setStyle(ButtonStyle.Secondary)
                )]
            })
        }
    }
}

async function getResponse(interaction, tab = CIRCUIT_TAB.Buy) {
    const [player,] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });
    const stats = await player.stats();

    if (stats.total.tears < 1) {
        return {
            content: "*circuitry is still a little too complex to figure out for you... maybe with a bit more understanding of the world, you could work with electronics.*",
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("circuits:delete")
                        .setLabel("okay...!")
                        .setStyle(ButtonStyle.Secondary)
                )
            ]
        }
    }

    const availableTabs = [CIRCUIT_TAB.Buy, CIRCUIT_TAB.Milestones];

    const container = new ContainerBuilder()
        .setAccentColor(0x57FF6D)
    
    const tabRow = new ActionRowBuilder()

    if (stats.total.circuits > 0) {
        availableTabs.push(CIRCUIT_TAB.Allocate)
    }
    if (Object.entries(player.circuitRules).length > 0) {
        availableTabs.push(CIRCUIT_TAB.Edit)
    }

    for (const tabName of availableTabs) {
        const button = new ButtonBuilder()
            .setCustomId(`circuits:section-${tabName}`)
            .setLabel(tabName)
            .setStyle(tab === tabName ? ButtonStyle.Primary : ButtonStyle.Secondary);

        tabRow.addComponents(button);
    }
    for (const sectionName of Object.values(CIRCUIT_TAB)) {
        if (!availableTabs.includes(sectionName)) {
            tabRow.addComponents(new ButtonBuilder()
                .setCustomId(`circuits:section-${sectionName}`)
                .setLabel(`???`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
        }
    }

    if (tab === CIRCUIT_TAB.Buy) {
        let desc = "### circuitboard shop\n";

        if (stats.total.circuits < 1) {
            desc += "to make use of your newfound electronics knowledge, you could get a circuitboard! they can help you automate things you don't want to do.\n"
        }

        desc += `the next circuitboard costs ${formatNumber(getCircuitBoardCost(stats.total.circuits), {} )} APT, and you have **${formatNumber(player.apt, { options: player.formatSettings })}**. care to buy?`
        desc += `\nyou currently have ${player.circuits} circuitboard${player.circuits === 1 ? "" : "s"} available.`
    
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(desc))
        container.addActionRowComponents((row) => row.addComponents(
            new ButtonBuilder()
                .setCustomId("circuits:buy")
                .setLabel("buy one!")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(player.apt < getCircuitBoardCost(stats.total.circuits))
        ))
    }

    // TODO handle other tabs
    if (tab !== CIRCUIT_TAB.Buy) {
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent("coming soon lol"))
    }

    return { embeds: [], components: [container, tabRow], flags: MessageFlags.IsComponentsV2 };
}

function getCircuitBoardCost(owned) {
    return Math.floor(((1 + owned / 2) ** 2) * 10)
}