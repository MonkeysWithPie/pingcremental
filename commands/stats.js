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
            await interaction.reply(await getGlobalMessage(interaction.user.id));
            return;
        } else if (interaction.options.getSubcommand() === 'user') {
            const user = interaction.options.getUser('user') || interaction.user;
            await interaction.reply(await getUserMessage(user.id, interaction));
            return;
        }
    },
    buttons: {
        refresh: (async (interaction, [type, selfId]) => {
            if (type === 'global') {
                await interaction.update(await getGlobalMessage(selfId.replace("global", "") || interaction.user.id));
                return;
            } 

            await interaction.update(await getUserMessage(type || interaction.user.id, interaction, selfId));
        })
    },
}

async function getGlobalMessage(selfId) {
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
    const selfData = await database.Player.findByPk(selfId);
    const formatOptions = { options: selfData.formatOptions }

    const embed = new EmbedBuilder()
        .setTitle(`global stats`)
        .setColor('#bd6fb8')
        .setDescription(
                `${formatNumber(count, formatOptions)} people have pinged at least once\n` +
                `\`${formatNumber(totalScore, formatOptions)} pts\` gained in total\n` +
                `\`${formatNumber(ownedScore, formatOptions)} pts\` currently owned\n` +
                `${formatNumber(totalClicks, formatOptions)} pings dealt with\n` +
                `${formatNumber(blueClicked, formatOptions)} blue pings clicked\n` +
                `${formatNumber(blueMissed, formatOptions)} blue pings missed\n` +
                `${formatNumber(luckyFound, formatOptions)} lucky pings found`
        )
        .setTimestamp();
    
    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`stats:refresh-global-${selfId}`)
                        .setLabel('refresh')
                        .setStyle(ButtonStyle.Secondary)
                )
        ],
    };
}

async function getUserMessage(userId, interaction, selfId) {
    const player = await database.Player.findByPk(userId);
    if (!player) return { content: `<@${userId}> hasn't pinged yet.`, allowedMentions: { parse: [] }, flags: MessageFlags.Ephemeral };
    
    const self = await database.Player.findByPk(selfId);
    const formatOptions = { options: self.formatOptions }

    const upgrades = player.upgrades;

    const simulatedPing = await ping(interaction, false, { forceNoRNG: true, userId: userId });
    const bluePingChance = simulatedPing.currentEffects.blue;
    const blueMult = simulatedPing.currentEffects.blueStrength || 1;

    // monster of a string (TODO: probably refactor later)
    let desc = `viewing stats for **${await player.getUserDisplay(interaction.client, database)}**\n` +
    
            `\n__the basics__\n` +
            `${formatNumber(player.totalClicks, formatOptions)} total ping${player.totalClicks === 1 ? '' : 's'}\n` +
            `${player.totalClicks !== player.clicks ? `${formatNumber(player.clicks, formatOptions)} ping${player.clicks === 1 ? '' : 's'} this eternity\n` : ''}` +
            `\`${formatNumber(player.totalScore, formatOptions)} pts\` in total\n` +
            `${player.totalPip ? 
                `${formatNumber(player.totalPip, formatOptions)} total PIP obtained\n` +
                `${formatNumber(player.totalEternities, formatOptions)} total eternit${player.totalEternities === 1 ? 'y' : 'ies'}\n` +
                `${player.totalEternities !== player.eternities ? `${formatNumber(player.eternities, formatOptions)} eternit${player.eternities === 1 ? 'y' : 'ies'} this tear\n` : ''}`
            : ''}` +
            `${player.totalTears ? 
                `${formatNumber(player.totalTears, formatOptions)} total tear${player.totalTears === 1 ? '' : 's'}\n` +
                `${formatNumber(player.totalThread, formatOptions)} total thread gained\n`
            : ''}` +

            `\n__blue pings__\n` +
            `${formatNumber(player.bluePings, formatOptions)} blue ping${player.bluePings === 1 ? '' : 's'} clicked\n` +
            `${formatNumber(player.bluePingsMissed, formatOptions)} missed blue ping${player.bluePingsMissed === 1 ? '' : 's'} (${player.bluePingMissRate}% miss rate)\n` +
            `${upgrades.bluePingChance < 0 ? `0%` : `${formatNumber(bluePingChance, { options: self.formatOptions, decimalPlaces: 1 })}%`} blue ping chance\n` + 
            `${blueMult.toFixed(2)}x blue ping strength = ${formatNumber(blueMult*15, formatOptions)}x \`pts\` on a blue ping\n` +

            `\n__rarities__\n` +
            `\`${formatNumber(player.highestScore, formatOptions)} pts\` in one ping\n` +
            `${formatNumber(player.highestBlueStreak, formatOptions)} blue ping${player.highestBlueStreak === 1 ? '' : 's'} in a row\n` +
            `${formatNumber(player.luckyPings, formatOptions)} lucky ping${player.luckyPings === 1 ? '' : 's'}\n` +
            `${player.highestCoinflipCount ? `${formatNumber(player.highestCoinflipCount, formatOptions)} coinflip${player.highestCoinflipCount === 1 ? '' : 's'} in one ping\n` : ''}` +
            `${player.highestPigScore ? `${formatNumber(player.highestPigScore, formatOptions)} pig score in one ping\n` : ''}`;

    if (player.highestArtisanCombo || player.highestOrchestraCombo) desc += `\n__skill combos__\n` +
            `${player.highestArtisanCombo ? `${formatNumber(player.highestArtisanCombo, formatOptions)} artisan combo at once\n` : ''}` +
            `${player.highestOrchestraCombo ? `${formatNumber(player.highestOrchestraCombo, formatOptions)} orchestra combo at once\n` : ''}`;

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
                        .setCustomId(`stats:refresh-${userId}-${selfId}`)
                        .setLabel('refresh')
                        .setStyle(ButtonStyle.Secondary)
                )
        ],
    };
}