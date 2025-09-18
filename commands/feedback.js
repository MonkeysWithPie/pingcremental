const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, MessageFlags, TextInputBuilder, ModalBuilder } = require('discord.js');
const database = require('./../helpers/database.js')
const feedbackCategories = [
    'bug',
    'upgrade',
    'balancing',
    'other'
]
const ownerId = process.env.OWNER_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('give or see feedback for the bot')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('submit feedback for the bot')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('the type of feedback')
                        .setRequired(true)
                        .addChoices(
                            { name: 'report bug', value: 'bug' },
                            { name: 'new upgrade', value: 'upgrade' },
                            { name: 'balancing change', value: 'balancing' },
                            { name: 'other/misc', value: 'other' }
                        )
                )
                .addStringOption(option =>
                    option.setName('feedback')
                        .setDescription('your feedback')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('view and modify recieved feedback')
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'submit') {
            if (interaction.user.id !== ownerId && await database.Feedback.count({ where: { userId: interaction.user.id } }) >= 20) {
                return await interaction.reply({ content: 'you\'ve submitted a lot of feedbacks! please wait until they are reviewed before submitting more, or remove them from the queue yourself.', flags: MessageFlags.Ephemeral });
            }

            const feedbackType = interaction.options.getString('type');
            const feedbackText = interaction.options.getString('feedback');
            const userId = interaction.user.id;

            await database.Feedback.create({ userId, type: feedbackType, text: feedbackText });
            await interaction.client.users.fetch(ownerId).then(user => {
                sillies = ['ding dong! new feedback is here', 'feedback! feedback! get your feedback here!', 'someone has an opinion!', 'a package was delievered!', 'i have bad news... feedback just arrived!']
                user.send(`${sillies[Math.floor(Math.random() * sillies.length)]}\n\n__${feedbackType}__ from __${interaction.user.username}__ (${interaction.user.id})\n${feedbackText}`);
            })
            await interaction.reply({ content: `success! thanks for the feedback.`, flags: MessageFlags.Ephemeral });
        }
        else if (interaction.options.getSubcommand() === 'view') {
            await interaction.reply(await buildFeedbackEmbed(interaction, feedbackCategories[0]));
        }
    },
    buttons: {
        "category": (async (interaction, newCategory) => {
            await interaction.update(await buildFeedbackEmbed(interaction, newCategory));
        })
    },
    dropdowns: {
        "chooseFeedback": (async (interaction) => {
            const feedbackId = interaction.values[0];
            if (feedbackId === 'none') return await interaction.reply({ content: 'you didn\'t select anything? how did you manage that?', ephemeral: true });
            const feedback = await database.Feedback.findByPk(feedbackId);

            if (!feedback) return await interaction.reply({ content: 'this one doesn\'t even exist? how?', ephemeral: true });
            if (feedback.userId !== interaction.user.id && interaction.user.id !== ownerId) return await interaction.reply({ content: 'you don\'t have permission to delete this...', ephemeral: true });
            
            if (feedback.userId === interaction.user.id && interaction.user.id !== ownerId) {
                await feedback.destroy();
                await interaction.update(await buildFeedbackEmbed(interaction, feedback.type));
                return await interaction.followUp({ content: `deleted your feedback.`, flags: MessageFlags.Ephemeral });
            }


            const dropdown = new StringSelectMenuBuilder()
                .setCustomId(`feedback:finishDelete-${feedbackId}`)
                .setPlaceholder('how come?')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('added/fixed')
                        .setValue('added'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('denied')
                        .setValue('denied'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('not a suggestion')
                        .setValue('notSuggestion'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('silently delete')
                        .setValue('silentDelete'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('no wait, never mind')
                        .setValue('cancel')
                );
            await interaction.update(await buildFeedbackEmbed(interaction, feedback.type));
            await interaction.followUp({ content: `deleting feedback #${feedbackId}?`, flags: MessageFlags.Ephemeral, components: [new ActionRowBuilder().addComponents(dropdown)] });
        }),
        "finishDelete": (async (interaction, feedbackId) => {
            const deleteType = interaction.values[0];
            if (deleteType === 'cancel') {
                return await interaction.update({ content: 'cancelled deletion.', components: [], flags: MessageFlags.Ephemeral });
            }

            const feedback = await database.Feedback.findByPk(feedbackId);
            if (deleteType === 'silentDelete') {
                await feedback.destroy();
                return await interaction.update({ content: `deleted feedback #${feedbackId} silently.`, components: [], flags: MessageFlags.Ephemeral });
            }

            const userToDm = await interaction.client.users.fetch(feedback.userId);
            if (!userToDm) {
                await feedback.destroy();
                return await interaction.update({ content: `couldn't find the user to DM; deleting #${feedbackId} silently.`, components: [], flags: MessageFlags.Ephemeral });
            }

            let message = `your below ${feedback.type === 'bug' ? 'bug' : 'feedback'} was `;
            if (deleteType === 'added') {
                message += `${feedback.type === 'bug' ? 'fixed' : 'added'}! thank you for your feedback.`;
            } else if (deleteType === 'denied') {
                message += `${feedback.type === 'bug' ? 'found to be invalid' : 'denied'}. thank you for your feedback.`;
            } else if (deleteType === 'notSuggestion') {
                message += 'deemed to not be a suggestion, so it was deleted. /feedback is for __suggestions and bugs only__. if you gave vague feedback (e.g. "i don\'t like how slow upgrading is"), feel free to suggest more specific solutions or changes.';
            }
            message += `\n\nyour feedback:\n${feedback.text}`;

            await feedback.destroy();
            await userToDm.send(message);
            await interaction.update({ content: `deleted feedback #${feedbackId} and notified the user.`, components: [], flags: MessageFlags.Ephemeral });
        })
    },
}

async function buildFeedbackEmbed(interaction, category) {
    // get all feedback for the category
    const feedbacks = await database.Feedback.findAll({
        where: { type: category },
        order: [['createdAt', 'DESC']] // newest first
    });

    const buttons = [];
    // prep buttons
    for (const cat of feedbackCategories) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`feedback:category-${cat}`)
                .setLabel(`${cat} (${await database.Feedback.count({ where: { type: cat } })})`)
                .setStyle(cat === category ? ButtonStyle.Primary : ButtonStyle.Secondary)
        )
    }

    const row = new ActionRowBuilder()
        .addComponents(buttons);
    const dropdown = new StringSelectMenuBuilder()
        .setCustomId('feedback:chooseFeedback')
        .setPlaceholder('pick feedback to delete')

    let description = `__${feedbacks.length}__ for category __${category}__\n`;

    for (const feedback of feedbacks) {
        const user = await interaction.client.users.fetch(feedback.userId); // find the user for username display
        description += `\n- __${user.username}__: ${feedback.text}`;
        if (interaction.user.id === feedback.userId || interaction.user.id === ownerId) { // if the user is the owner or the feedback author, add the feedback to the dropdown
            dropdown.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(feedback.text.length > 50 ? feedback.text.substring(0, 50) + '...' : feedback.text)
                    .setValue(`${feedback.dbId}`)
            )
        }

    }

    if (feedbacks.length === 0) {
        description = `__no feedback here.__`;
    }

    const embed = new EmbedBuilder()
        .setTitle("feedback")
        .setColor('#997565')
        .setDescription(description)

    const components = [row];
    if (dropdown.options.length > 0) { // only add dropdown if there are options
        components.push(new ActionRowBuilder().addComponents(dropdown));
    }
    return {
        embeds: [embed],
        components: components
    }
}