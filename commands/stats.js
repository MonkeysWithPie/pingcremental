const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder } = require('discord.js');
const database = require('./../helpers/database.js');
const formatNumber = require('./../helpers/formatNumber.js');
const ping = require('../helpers/pingCalc.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('numbers and stuff')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addSubcommand(subcommand =>
            subcommand
                .setName('global')
                .setDescription('get global stats')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('get stats per person')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('the user to get stats for')
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'global') {
            await interaction.reply(await getGlobalMessage());
            return;
        } else if (interaction.options.getSubcommand() === 'user') {
            const user = interaction.options.getUser('user') || interaction.user;
            await interaction.reply(await getUserMessage(user.id, interaction));
            return;
        }
    },
    buttons: {
        refresh: (async (interaction, userId) => {
            if (userId === 'global') {
                await interaction.update(await getGlobalMessage());
                return;
            } 
                await interaction.update(await getUserMessage(userId || interaction.user.id, interaction));
            
        })
    },
}

async function getGlobalMessage() {
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

    const embed = new EmbedBuilder()
        .setTitle(`global stats`)
        .setColor('#bd6fb8')
        .setDescription(
                `${formatNumber(count)} people have pinged at least once\n` +
                `\`${formatNumber(totalScore)} pts\` gained in total\n` +
                `\`${formatNumber(ownedScore)} pts\` currently owned\n` +
                `${formatNumber(totalClicks)} pings dealt with\n` +
                `${formatNumber(blueClicked)} blue pings clicked\n` +
                `${formatNumber(blueMissed)} blue pings missed\n` +
                `${formatNumber(luckyFound)} lucky pings found`
        )
        .setTimestamp();
    
    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`stats:refresh-global`)
                        .setLabel('refresh')
                        .setStyle(ButtonStyle.Secondary)
                )
        ],
    };
}

async function getUserMessage(userId, interaction) {
    const player = await database.Player.findByPk(userId);
    if (!player) return { content: `<@${userId}> hasn't pinged yet.`, allowedMentions: { parse: [] }, flags: MessageFlags.Ephemeral };
    
    const upgrades = player.upgrades;

    const simulatedPing = await ping(interaction, false, { forceNoRNG: true, userId: userId });
    const bluePingChance = simulatedPing.currentEffects.blue;
    const blueMult = simulatedPing.currentEffects.blueStrength || 1;

    // monster of a string (TODO: probably refactor later)
    let desc = `viewing stats for **${await player.getUserDisplay(interaction.client, database)}**\n` +
    
            `\n__the basics__\n` +
            `${formatNumber(player.totalClicks)} total ping${player.totalClicks === 1 ? '' : 's'}\n` +
            `${player.totalClicks !== player.clicks ? `${formatNumber(player.clicks)} ping${player.clicks === 1 ? '' : 's'} this eternity\n` : ''}` +
            `\`${formatNumber(player.totalScore)} pts\` in total\n` +
            `${player.totalPip ? 
                `${formatNumber(player.totalPip)} total PIP obtained\n` +
                `${formatNumber(player.totalEternities)} total eternit${player.totalEternities === 1 ? 'y' : 'ies'}\n` +
                `${player.totalEternities !== player.eternities ? `${formatNumber(player.eternities)} eternit${player.eternities === 1 ? 'y' : 'ies'} this tear\n` : ''}`
            : ''}` +
            `${player.totalTears ? 
                `${formatNumber(player.totalTears)} total tear${player.totalTears === 1 ? '' : 's'}\n` +
                `${formatNumber(player.totalThread)} total thread gained\n`
            : ''}` +

            `\n__blue pings__\n` +
            `${formatNumber(player.bluePings)} blue ping${player.bluePings === 1 ? '' : 's'} clicked\n` +
            `${formatNumber(player.bluePingsMissed)} missed blue ping${player.bluePingsMissed === 1 ? '' : 's'} (${player.bluePingMissRate}% miss rate)\n` +
            `${upgrades.bluePingChance < 0 ? `0%` : `${(bluePingChance).toFixed(1)}%`} blue ping chance\n` + 
            `${blueMult.toFixed(2)}x blue ping strength = ${(blueMult*15).toFixed(2)}x \`pts\` on a blue ping\n` +

            `\n__rarities__\n` +
            `\`${formatNumber(player.highestScore)} pts\` in one ping\n` +
            `${formatNumber(player.highestBlueStreak)} blue ping${player.highestBlueStreak === 1 ? '' : 's'} in a row\n` +
            `${formatNumber(player.luckyPings)} lucky ping${player.luckyPings === 1 ? '' : 's'}\n` +
            `${player.highestCoinflipCount ? `${formatNumber(player.highestCoinflipCount)} coinflip${player.highestCoinflipCount === 1 ? '' : 's'} in one ping\n` : ''}` +
            `${player.highestPigScore ? `${formatNumber(player.highestPigScore)} pig score in one ping\n` : ''}`;

    if (player.highestArtisanCombo || player.highestOrchestraCombo) desc += `\n__skill combos__\n` +
            `${player.highestArtisanCombo ? `${formatNumber(player.highestArtisanCombo)} artisan combo at once\n` : ''}` +
            `${player.highestOrchestraCombo ? `${formatNumber(player.highestOrchestraCombo)} orchestra combo at once\n` : ''}`;

    const embed = new EmbedBuilder()
        .setTitle(`personal stats`)
        .setColor('#6fa7bd')
        .setDescription(desc)
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