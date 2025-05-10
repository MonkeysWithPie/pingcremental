const { SlashCommandBuilder, EmbedBuilder, InteractionContextType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const database = require('./../helpers/database.js')
const formatNumber = require('./../helpers/formatNumber.js');
const { getEmoji } = require('../helpers/emojis.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('check who\'s best')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('one sec...')] });
        await interaction.editReply(await getMessage(interaction)); // add (edited) so it doesn't move after refresh
    },
    buttons: {
        refresh: (async interaction => {
            await interaction.update(await getMessage(interaction));
        })
    }
}

async function getMessage(interaction) {
    let description = "";
    const topPlayers = await database.Player.findAll({
        order: [['totalScore', 'DESC']], // highest first
        attributes: ['userId', 'totalScore'], // only get userId and totalScore
        limit: 10, // top 10 only
    })

    let leaderboardEmojis = []
    for (let i = 0; i < 10; i++) {
        leaderboardEmojis.push(getEmoji(`rank_${i + 1}`)); // get the emoji for the position
    }
    leaderboardEmojis.push('✨');

    for (player of topPlayers) {
        const puser = await interaction.client.users.fetch(player.userId) // find the user for username display
        let userDisplay = puser.username.replaceAll("_", "\\_")
        if (player.userId == interaction.user.id) {
            userDisplay = `__${userDisplay}__` // highlight the user's own score
        }

        description +=
            `
${leaderboardEmojis[Math.min(leaderboardEmojis.length, player.position) - 1]} **${userDisplay}** - \`${formatNumber(player.score)} pts\` total`
    }

    // if the user is not in the leaderboard, add them to the end of the list
    if (lbPlayers.find(player => player.userId == interaction.user.id) == null) {
        description += `\n...\n**##** __**${interaction.user.username.replaceAll("_", "\\_")}**__ - \`${formatNumber((await database.Player.findByPk(interaction.user.id)).totalScore)} pts\` total`
    }

    const embed = new EmbedBuilder()
        .setTitle("leaderboard")
        .setColor('#9c8e51')
        .setDescription(description)
    const button = new ButtonBuilder()
        .setCustomId('leaderboard:refresh')
        .setLabel('refresh')
        .setStyle(ButtonStyle.Secondary)
    const row = new ActionRowBuilder()
        .addComponents(button)
    
    return {
        contents: "",
        embeds: [embed],
        components: [row]
    }
}