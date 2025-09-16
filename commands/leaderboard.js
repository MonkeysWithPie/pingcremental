const { SlashCommandBuilder, EmbedBuilder, InteractionContextType, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const database = require('./../helpers/database.js')
const formatNumber = require('./../helpers/formatNumber.js');
const { getEmoji } = require('../helpers/emojis.js');
const { Sequelize } = require('sequelize');

let leaderboardTypes = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('check who\'s best')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('one sec...')] });
        await interaction.editReply(await getMessage(interaction, 'totalScore')); // add (edited) so it doesn't move after refresh
    },
    buttons: {
        refresh: (async (interaction, leaderboard) => {
            await interaction.deferUpdate();
            await interaction.editReply(await getMessage(interaction, leaderboard));
        }),
        ac: (async (interaction, leaderboard) => {
            await interaction.deferUpdate();
            await interaction.editReply(await getMessage(interaction, leaderboard, !isAutoclickerShown(interaction.message.components)));
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

function isAutoclickerShown(components) {
    return components[0].components[1].label.endsWith('shown');
}

async function getMessage(interaction, leaderboardType, autoclickOverride = null) {
    if (!leaderboardTypes) initTypes();
    if (!leaderboardType) leaderboardType = "totalScore";

    let showAutoclicker;
    if (autoclickOverride !== null) showAutoclicker = autoclickOverride;
    else if (!interaction.message) {
        const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });
        showAutoclicker = playerProfile.settings.usesAutoclicker === 'yes';
    } else {
        showAutoclicker = isAutoclickerShown(interaction.message.components);
    }

    let description = "";
    const topPlayers = await database.Player.findAll({
        order: [[leaderboardType, 'DESC']], // highest first
        attributes: ['userId', leaderboardType], // only get userId and totalScore
        where: showAutoclicker ? {} : Sequelize.literal(`JSON_EXTRACT(settings, '$.usesAutoclicker') IS NOT 'yes'`)
    })

    let leaderboardEmojis = []
    for (let i = 0; i < 10; i++) {
        leaderboardEmojis.push(getEmoji(`rank_${i + 1}`)); // get the emoji for the position
    }
    leaderboardEmojis.push('✨');

    let position = 0;
    let showedSelf = false;

    for (player of topPlayers) {
        position++;
        if (position > 10) break; // only show the top 10 players

        description +=
            `
${leaderboardEmojis[Math.min(leaderboardEmojis.length, position) - 1]} ${await formatPlayer(player.userId, player[leaderboardType], leaderboardType, interaction)}`
        showedSelf = showedSelf || (interaction.user.id == player.userId);
    }

    if (!showedSelf) {
        // find position of the user
        const userIndex = topPlayers.findIndex(player => player.userId == interaction.user.id);

        // user may not be displayed because of autoclicker filter
        if (userIndex !== -1) {
            // show next user and user below
            if (userIndex >= 12) {
                description += `\n...`
            }

            if (userIndex >= 11) {
                const userBelow = topPlayers[userIndex - 1];
                description += `\n#${userIndex} ${await formatPlayer(userBelow.userId, userBelow[leaderboardType], leaderboardType, interaction)}`
            }

            description += `\n#${userIndex + 1} ${await formatPlayer(interaction.user.id, topPlayers[userIndex][leaderboardType], leaderboardType, interaction)}`

            if (userIndex !== topPlayers.length - 1) {
                const userAbove = topPlayers[userIndex + 1];
                description += `\n#${userIndex + 2} ${await formatPlayer(userAbove.userId, userAbove[leaderboardType], leaderboardType, interaction)}`
            }
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
    const autoclickButton = new ButtonBuilder()
        .setCustomId(`leaderboard:ac-${leaderboardType}`)
        .setLabel(`${showAutoclicker ? 'shown' : 'hidden'}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(getEmoji('autoclicker'))
    const row = new ActionRowBuilder()
        .addComponents(refreshButton, autoclickButton)

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
        needReInit = needReInit || (value.emoji == '🟥');
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
        totalScore: {
            name: 'total pts',
            emoji: '✨',
            metric: "`pts` total"
        },
        totalClicks: {
            name: 'total clicks',
            emoji: '🖱️',
            metric: "clicks"
        },
        highestScore: {
            name: 'highest score',
            emoji: getEmoji('ponder_favored', '🏆'),
            metric: "`pts` in best ping"
        },
        bluePings: {
            name: 'blue pings',
            emoji: getEmoji('upgrade_blue', '🔵'),
            metric: "blue pings clicked"
        },
        totalEternities: {
            name: 'total eternities',
            emoji: getEmoji('upgrade_pingularity', '♾️'),
            metric: "eternities"
        },
        totalTears: {
            name: 'total tears',
            emoji: '🌆',
            metric: "tears"
        },
        totalPip: {
            name: 'total pip',
            emoji: '🟣',
            metric: "pip total"
        },
        totalThread: {
            name: 'total thread',
            emoji: '🧵',
            metric: "thread total"
        },
        bluePingsMissed: {
            name: 'blue pings missed',
            emoji: getEmoji('ponder_regret', '😔'),
            metric: "blue pings missed"
        },
        highestBlueStreak: {
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

async function formatPlayer(userId, score, leaderboard, interaction) {
    const player = await database.Player.findByPk(`${userId}`);

    let userDisplay = await player.getUserDisplay(interaction.client, database);
    if (interaction.user.id == userId) {
        userDisplay = `__${userDisplay}__` // highlight the user's own score
    }
    return `**${userDisplay}** - \`${formatNumber(score, true, 5)}\` ${leaderboardTypes[leaderboard].metric}`
}