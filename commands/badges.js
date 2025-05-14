const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder } = require('discord.js');
const database = require('./../helpers/database.js');
const { getEmoji } = require('./../helpers/emojis.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badges')
        .setDescription('show off your fancy accomplishments')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('check someone\'s badges')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('the user to get badges for')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('view all possible badges')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('showcase')
                .setDescription('change which badges you have displayed')
                ),
    async execute(interaction) {
        
    },
}