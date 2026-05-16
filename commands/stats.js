const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const database = require('./../helpers/database.js');
const formatNumber = require('./../helpers/formatNumber.js');
const { PrestigeLayers } = require('../helpers/commonEnums.js');

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
                .addStringOption(option =>
                    option.setName('layer')
                        .setDescription('which prestige layer to view stats for')
                        .addChoices(PrestigeLayers.map(layer => ({ name: layer, value: layer })))
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'global') {
            await interaction.reply(await getGlobalMessage(interaction.user.id));
            return;
        } else if (interaction.options.getSubcommand() === 'user') {
            const user = interaction.options.getUser('user') || interaction.user;
            const layer = interaction.options.getString('layer') || 'total';
            await interaction.reply(await getUserMessage(user.id, interaction, interaction.user.id, layer));
            return;
        }
    },
    buttons: {
        refresh: (async (interaction, [type, selfId, layer]) => {
            if (type === 'global') {
                await interaction.update(await getGlobalMessage(selfId.replace("global", "") || interaction.user.id));
                return;
            } 

            await interaction.update(await getUserMessage(type || interaction.user.id, interaction, selfId, layer));
        })
    },
    dropdowns: {
        layer: (async (interaction, [userId, selfId]) => {
            const selectedLayer = interaction.values[0];
            await interaction.update(await getUserMessage(userId, interaction, selfId, selectedLayer));
        })
    }
}

async function getGlobalMessage(selfId) {
    const where = { layer: 'total' };
    const globalPings = await Promise.all([
        database.Player.unscoped().count(),
        database.PlayerStat.sum('score', { where }),
        database.PlayerStat.sum('clicks', { where }),
        database.PlayerStat.sum('bluePings', { where }),
        database.PlayerStat.sum('bluePingsMissed', { where }),
        database.PlayerStat.sum('luckyPings', { where }),
    ]);
    const [playerCount, totalScore, totalClicks, blueClicked, blueMissed, luckyFound] = globalPings;
    const selfData = await database.Player.findByPk(selfId);
    const formatSettings = { options: selfData.formatSettings }

    const embed = new EmbedBuilder()
        .setTitle(`global stats`)
        .setColor('#bd6fb8')
        .setDescription(
                `${formatNumber(playerCount, formatSettings)} people have pinged at least once\n` +
                `\`${formatNumber(totalScore, formatSettings)} pts\` gained in total\n` +
                `${formatNumber(totalClicks, formatSettings)} pings dealt with\n` +
                `${formatNumber(blueClicked, formatSettings)} blue pings clicked\n` +
                `${formatNumber(blueMissed, formatSettings)} blue pings missed\n` +
                `${formatNumber(luckyFound, formatSettings)} lucky pings found`
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

async function getUserMessage(userId, interaction, selfId, layer = "total") {
    const player = await database.Player.findByPk(userId);
    if (!player) return { content: `<@${userId}> hasn't pinged yet.`, allowedMentions: { parse: [] }, flags: MessageFlags.Ephemeral };

    const self = await database.Player.findByPk(selfId);
    const formatSettings = { options: self.formatSettings }

    const allStats = await player.stats();
    const stats = allStats[layer];
    const totalStats = allStats.total;

    let layerReached = true;
    if (layer === 'eternity' && totalStats.eternities === 0) layerReached = false;
    if (layer === 'tear' && totalStats.tears === 0) layerReached = false;
    if (!layerReached) layer = 'total'; // fallback to total if layer not reached yet

    let desc = `viewing stats for **${await player.getUserDisplay(interaction.client, database)}**\n`

    desc += `\n__the basics__\n` +
        `${formatNumber(stats.clicks, formatSettings)} ping${stats.clicks === 1 ? '' : 's'}\n` +
        (stats.aptClicks ? `${formatNumber(stats.aptClicks, formatSettings)} ping${stats.aptClicks === 1 ? '' : 's'} with APT\n` : '') +
        `\`${formatNumber(stats.score, formatSettings)} pts\` gained\n` +
        `\`${formatNumber(stats.highScore, formatSettings)} pts\` gained in a single ping\n` +
        `${formatNumber(stats.luckyPings, formatSettings)} lucky ping${stats.luckyPings === 1 ? '' : 's'}\n`;
    
    if (stats.bluePings > 0) {
        desc += `\n__blue pings__\n` +
            `${formatNumber(stats.bluePings, formatSettings)} blue ping${stats.bluePings === 1 ? '' : 's'} clicked\n` +
            `${formatNumber(stats.bluePingsMissed, formatSettings)} missed blue ping${stats.bluePingsMissed === 1 ? '' : 's'}\n` +
            `${formatNumber(stats.bluePingMissRate, formatSettings)}% blue ping miss rate\n` +
            `${formatNumber(stats.bluePingAppearRate, formatSettings)}% blue ping average rate\n` +
            `${formatNumber(stats.blueStreak, formatSettings)} blue ping${stats.blueStreak === 1 ? '' : 's'} in a row\n`
    }

    if (stats.eternities > 0) {
        desc += `\n__eternities__\n` +
            `${formatNumber(stats.eternities, formatSettings)} eternit${stats.eternities === 1 ? 'y' : 'ies'}\n` +
            `${formatNumber(stats.bp, formatSettings)} BP gained\n` +
            `${formatNumber(stats.pip, formatSettings)} PIP obtained\n` +
            `${formatNumber(stats.removedUpgrades, formatSettings)} upgrades lost from eternities\n`
    }

    if (stats.tears > 0) {
        desc += `\n__tears__\n` +
            `${formatNumber(stats.tears, formatSettings)} tear${stats.tears === 1 ? '' : 's'}\n` +
            `${formatNumber(stats.thread, formatSettings)} thread gained\n`
    }

    const luckbased = ["coinflip", "pigScore", "artisanCombo", "orchestraCombo"];
    const hasLuckBased = luckbased.some(stat => stats[stat] > 0);

    if (hasLuckBased) {
        desc += `\n__upgrades__\n` +
            (stats.coinflip ? `${formatNumber(stats.coinflip, formatSettings)} coinflip${stats.coinflip === 1 ? '' : 's'} in one ping\n` : '') +
            (stats.pigScore ? `${formatNumber(stats.pigScore, formatSettings)} pig score in one ping\n` : '') +
            (stats.artisanCombo ? `${formatNumber(stats.artisanCombo, formatSettings)} artisan combo at once\n` : '') +
            (stats.orchestraCombo ? `${formatNumber(stats.orchestraCombo, formatSettings)} orchestra combo at once\n` : '');
    }
            
    const embed = new EmbedBuilder()
        .setTitle(`personal stats`)
        .setColor('#6fa7bd')
        .setDescription(desc)
        .setTimestamp();
    const dropdown = new StringSelectMenuBuilder()
        .setCustomId(`stats:layer-${userId}-${selfId}`)
        .setMinValues(1)
        .setMaxValues(1)
    
    for (const prestigeLayer of PrestigeLayers.toReversed()) {
        if (prestigeLayer === "eternity" && totalStats.eternities === 0) continue;
        if (prestigeLayer === "tear" && totalStats.tears === 0) continue;

        dropdown.addOptions([
            new StringSelectMenuOptionBuilder()
                .setLabel(prestigeLayer)
                .setValue(prestigeLayer)
                .setDefault(prestigeLayer === layer)
        ]);
    }

    const refreshButton = new ButtonBuilder()
        .setCustomId(`stats:refresh-${userId}-${selfId}-${layer}`)
        .setLabel('refresh')
        .setStyle(ButtonStyle.Secondary)

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(dropdown),
            new ActionRowBuilder().addComponents(refreshButton)
        ],
    };
}