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
        .setAccentColor("#57FF6D")
    
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
        let desc = "";

        if (stats.total.circuits < 1) {
            desc = "to make use of your newfound electronics knowledge, you could get a circuitboard! they can help you automate things you don't want to do.\n"
        }

        desc += `the next circuitboard costs ${formatNumber(getCircuitBoardCost(stats.total.circuits), {} )} APT, and you have **${formatNumber(player.apt, { options: player.formatSettings })}**. care to buy?`
    }
}

function getCircuitBoardCost(owned) {
    return ((1 + owned / 2) ** 2) * 10
}