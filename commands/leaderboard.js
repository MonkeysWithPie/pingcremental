const { SlashCommandBuilder, EmbedBuilder, InteractionContextType, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const database = require('./../helpers/database.js')
const formatNumber = require('./../helpers/formatNumber.js');
const { getEmoji } = require('../helpers/emojis.js');

let leaderboardTypes = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('check who\'s best')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.deferReply();
        await interaction.editReply(await getMessage(interaction, 'score'));
    },
    buttons: {
        refresh: (async (interaction, leaderboard) => {
            await interaction.deferUpdate();
            await interaction.editReply(await getMessage(interaction, leaderboard));
        }),
        ac: (async (interaction, leaderboard) => {
            await interaction.deferUpdate();
            await interaction.editReply(await getMessage(interaction, leaderboard));
        })
    },
    dropdowns: {
        select: (async (interaction) => {
            const leaderboardType = interaction.values[0];
            await interaction.deferUpdate();
            await interaction.editReply(await getMessage(interaction, leaderboardType));
        })
    }
}

async function getMessage(interaction, leaderboardType) {
    if (!leaderboardTypes) initTypes();
    if (!leaderboardType) leaderboardType = "score";

    let description = "";
    const topStats = await database.PlayerStat.findAll({
        order: [[leaderboardType, 'DESC']], // highest first
        attributes: [leaderboardType, 'player'], // only get userId and totalScore
        where: {
            layer: 'total',
        }
    })

    const leaderboardEmojis = []
    for (let i = 0; i < 10; i++) {
        leaderboardEmojis.push(getEmoji(`rank_${i + 1}`)); // get the emoji for the position
    }
    leaderboardEmojis.push('✨');

    let position = 0;
    let showedSelf = false;

    for (const stats of topStats) {
        const player = stats.getPlayer();
        position++;
        if (position > 10) break; // only show the top 10 players

        description +=
            `
${leaderboardEmojis[Math.min(leaderboardEmojis.length, position) - 1]} ${await formatPlayer(player, stats[leaderboardType], leaderboardType, interaction)}`
        showedSelf = showedSelf || (interaction.user.id === player.userId);
    }

    if (!showedSelf) {
        // find position of the user
        const userIndex = topStats.findIndex(player => player.getPlayer().userId === interaction.user.id);

        // show next user and user below
        if (userIndex >= 12) {
            description += `\n...`
        }

        if (userIndex >= 11) {
            const userBelow = topStats[userIndex - 1];
            description += `\n#${userIndex} ${await formatPlayer(userBelow.getPlayer(), userBelow[leaderboardType], leaderboardType, interaction)}`
        }

        description += `\n#${userIndex + 1} ${await formatPlayer(interaction.user.id, topStats[userIndex][leaderboardType], leaderboardType, interaction)}`

        if (userIndex !== topStats.length - 1) {
            const userAbove = topStats[userIndex + 1];
            description += `\n#${userIndex + 2} ${await formatPlayer(userAbove.getPlayer(), userAbove[leaderboardType], leaderboardType, interaction)}`
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`leaderboard / ${leaderboardTypes[leaderboardType].emoji} ${leaderboardTypes[leaderboardType].name}`)
        .setColor('#9c8e51')
        .setDescription(description)
    const refreshButton = new ButtonBuilder()
        .setCustomId(`leaderboard:refresh-${leaderboardType}`)
        .setLabel('refresh')
        .setStyle(ButtonStyle.Secondary)
    const row = new ActionRowBuilder()
        .addComponents(refreshButton)

    const select = new StringSelectMenuBuilder()
        .setCustomId(`leaderboard:select`)
        .setPlaceholder(`select leaderboard type`)
    
    let needReInit = false;
    for (const [key, value] of Object.entries(leaderboardTypes)) {
        select.addOptions({
            label: value.name,
            value: key,
            emoji: value.emoji,
        })
        needReInit = needReInit || (value.emoji === '🟥');
    }
    if (needReInit) initTypes();

    const selectRow = new ActionRowBuilder()
        .addComponents(select)
        
    return {
        contents: "",
        embeds: [embed],
        components: [row, selectRow],
    }
}

// funky leaderboard caching in case getEmoji() returns a placeholder
function initTypes() {
    leaderboardTypes = {
        score: {
            name: 'total pts',
            emoji: '✨',
            metric: "`pts` total"
        },
        clicks: {
            name: 'total clicks',
            emoji: '🖱️',
            metric: "clicks"
        },
        highScore: {
            name: 'highest score',
            emoji: getEmoji('ponder_favored', '🏆'),
            metric: "`pts` in best ping"
        },
        bluePings: {
            name: 'blue pings',
            emoji: getEmoji('upgrade_blue', '🔵'),
            metric: "blue pings clicked"
        },
        eternities: {
            name: 'total eternities',
            emoji: getEmoji('upgrade_pingularity', '♾️'),
            metric: "eternities"
        },
        tears: {
            name: 'total tears',
            emoji: '🌆',
            metric: "tears"
        },
        pip: {
            name: 'total pip',
            emoji: '🟣',
            metric: "pip total"
        },
        thread: {
            name: 'total thread',
            emoji: '🧵',
            metric: "thread total"
        },
        bluePingsMissed: {
            name: 'blue pings missed',
            emoji: getEmoji('ponder_regret', '😔'),
            metric: "blue pings missed"
        },
        blueStreak: {
            name: 'highest blue streak',
            emoji: getEmoji('upgrade_chain', '🔗'),
            metric: "blue pings in a row"
        },
        luckyPings: {
            name: 'lucky pings',
            emoji: getEmoji('upgrade_special', '🍀'),
            metric: "rare pings discovered"
        },
    }
}

// TODO: fix
async function formatPlayer(player, score, leaderboard, interaction) {
    let userDisplay = await player.getUserDisplay(interaction.client);
    if (interaction.user.id === player.userId) {
        userDisplay = `__${userDisplay}__` // highlight the user's own score
    }
    
    // TODO: format options
    return `**${userDisplay}** - \`${formatNumber(score, { decimalPlaces: 5 })}\` ${leaderboardTypes[leaderboard].metric}`
}