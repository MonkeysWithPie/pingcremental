const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder } = require('discord.js');
const database = require('./../helpers/database.js');
const formatNumber = require('./../helpers/formatNumber.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('numbers and stuff')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('the user to get stats for')
                .setRequired(false)   
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const response = await getMessage(user.id);
        await interaction.reply(response);
    },
    buttons: {
        refresh: (async (interaction, userId) => {
            await interaction.update(await getMessage(userId || interaction.user.id));
        })
    },
}

async function getMessage(userId) {
    const player = await database.Player.findByPk(userId);
    if (!player) return { content: `<@${userId}> hasn't pinged yet.`, allowedMentions: { parse: [] }, flags: MessageFlags.Ephemeral };

    const globalPings = await Promise.all([
        database.Player.count(),
        database.Player.sum('totalScore'),
        database.Player.sum('score'),
        database.Player.sum('totalClicks'),
        database.Player.sum('bluePings'),
        database.Player.sum('bluePingsMissed'),
        database.Player.sum('luckyPings'),
    ]);

    const [count, totalScore, ownedScore, totalClicks, blueClicked, blueMissed, luckyFound] = globalPings;
    const upgrades = player.upgrades;

    const missRate = player.bluePings + player.bluePingsMissed > 0
        ? Math.round(player.bluePingsMissed / (player.bluePings + player.bluePingsMissed) * 100)
        : 0;

    let bluePingChance = upgrades.blue === 1 ? (0.01 + (upgrades.blueshift || 0) * 0.006 - (upgrades.redshift || 0) * 0.004) : 0;

    if ((upgrades.greenshift || 0) > 0) {
        bluePingChance = bluePingChance * (1 + 0.15 * upgrades.greenshift);
    }


    const embed = new EmbedBuilder()
        .setTitle(`Ping Stats`)
        .setColor('#bd6fb8') // Discord blurple color
        .addFields(
            { name: '__global__', value: 
                `${formatNumber(count)} people have pinged at least once\n` +
                `${formatNumber(totalScore)} total pts gained\n` +
                `${formatNumber(ownedScore)} pts currently owned\n` +
                `${formatNumber(totalClicks)} pings dealt with\n` +
                `${formatNumber(blueClicked)} blue pings clicked\n` +
                `${formatNumber(blueMissed)} blue pings missed\n` +
                `${formatNumber(luckyFound)} lucky pings found`
            },
            { name: `__personal__`, value: 
                `*viewing stats for <@${userId}>*\n` +
                `${formatNumber(player.totalClicks)} total ping${player.totalClicks === 1 ? '' : 's'}\n` +
                // show eternity pings if not the same as total
                `${player.totalClicks !== player.clicks ? `${formatNumber(player.clicks)} ping${player.clicks === 1 ? '' : 's'} this eternity\n` : ''}` +
                `${formatNumber(player.totalScore)} total pts\n` +
                `${formatNumber(player.bluePings)} blue ping${player.bluePings === 1 ? '' : 's'} clicked\n` +
                `${formatNumber(player.bluePingsMissed)} missed blue ping${player.bluePingsMissed === 1 ? '' : 's'} (${missRate}% miss rate)\n` +
                `${formatNumber(player.luckyPings)} lucky ping${player.luckyPings === 1 ? '' : 's'}\n` +
                `${formatNumber(player.highestBlueStreak)} highest blue ping streak`
            },
            { name: `__extra__`, value:
                `${upgrades.bluePingChance < 0 ? `0%` : `${(bluePingChance*100).toFixed(1)}%`} blue ping chance`
            }
        )
        .setTimestamp();
    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`stats:refresh-${userId}`)
                        .setLabel('refresh')
                        .setStyle(ButtonStyle.Secondary)
                )
        ],
    };
}