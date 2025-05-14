const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { Op } = require('sequelize');
const database = require('./../helpers/database.js');
const { getEmoji } = require('./../helpers/emojis.js')
const { ownerId } = require('./../config.json');

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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('award')
                .setDescription('grant (or remove) a badge to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('the user to grant the badge to')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('badge')
                        .setDescription('the badge to grant or remove')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('create a new badge')
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'view') {
            const user = interaction.options.getUser('user') || interaction.user;
            const player = await database.Player.findByPk(`${user.id}`);

            if (player.badges.length === 0) {
                return await interaction.reply({ content: `${getEmoji('badge_empty')} ${user.username} has no badges.`, flags: MessageFlags.Ephemeral });
            }
            
            const badges = await database.Badge.findAll({
                where: { dbId: player.badges },
            });
            let description = `badges of ${await player.getUserDisplay(interaction.client, database)}\n\n`;

            for (const badge of badges) {
                description += `${badgeDisplay(badge)}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor('#e3cf6b')
                .setDescription(description.trim());

            return await interaction.reply({ embeds: [embed] });
        } 
        else if (interaction.options.getSubcommand() === 'list') {
            const badges = await database.Badge.findAll();

            if (badges.length === 0) {
                return await interaction.reply({ content: 'there are somehow no badges yet...?', flags: MessageFlags.Ephemeral });
            }

            let description = '';
            for (const badge of badges) {
                description += `${badgeDisplay(badge)}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor('#d1b586')
                .setDescription(description.trim());

            return await interaction.reply({ embeds: [embed] });
        }
        else if (interaction.options.getSubcommand() === 'showcase') {
            return await interaction.reply(await getShowcaseDisplay(interaction));
        }
        else if (interaction.options.getSubcommand() === 'award') {
            if (interaction.user.id !== ownerId) {
                return await interaction.reply({ content: 'you can\'t do that, you\'re not my owner', flags: MessageFlags.Ephemeral });
            }

            const user = interaction.options.getUser('user');
            const badgeId = parseInt(interaction.options.getString('badge'));
            if (isNaN(badgeId)) {
                return await interaction.reply({ content: 'that\'s not a badge...?', flags: MessageFlags.Ephemeral });
            }

            const player = await database.Player.findByPk(`${user.id}`);
            const badge = await database.Badge.findByPk(badgeId);
            let dmMessage = '';
            if (player.badges.includes(badgeId)) {
                player.badges = player.badges.filter(badge => badge !== badgeId);
                player.displayedBadges = player.displayedBadges.filter(badgeId => badgeId !== badgeId);

                dmMessage = `**bad news...**\n\nyou lost the badge ${badgeDisplay(badge,true)}.\nif you think this was a mistake, stay tuned; your badge will likely be restored soon!`;
            } else {
                player.badges.push(badgeId);

                dmMessage = `**good news!!**\n\nyou have been awarded the badge ${badgeDisplay(badge,true)}! be sure to show it off with \`/badges\`.`;
            }
            await player.save();

            const dmablePlayer = await interaction.client.users.resolve(user.id);
            await dmablePlayer.send(dmMessage);
        }
        else if (interaction.options.getSubcommand() === 'create') {
            if (interaction.user.id !== ownerId) {
                return await interaction.reply({ content: 'you can\'t do that, you\'re not my owner', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId('badges:create')
                .setTitle('creating a new badge...');

            const nameInput = new TextInputBuilder()
                .setCustomId('badgeNameInput')
                .setLabel('name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const emojiInput = new TextInputBuilder()
                .setCustomId('badgeEmojiInput')
                .setLabel('emoji')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const descriptionInput = new TextInputBuilder()
                .setCustomId('badgeDescriptionInput')
                .setLabel('description')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('how does someone get this badge?')
                .setRequired(true);
            const flavorTextInput = new TextInputBuilder()
                .setCustomId('badgeFlavorTextInput')
                .setLabel('flavor text')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('what\'s the backstory of this badge?')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(emojiInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(flavorTextInput),
            );
            await interaction.showModal(modal);
        }
    },
    dropdowns: {
        "badgeSelect": async (interaction) => {
            const badgeToToggle = parseInt(interaction.values[0]);
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);

            let followUp = null;
            const okButton = new ButtonBuilder()
                .setCustomId('showcase:delete')
                .setLabel('oh... okay')
                .setStyle(ButtonStyle.Secondary);

            if (player.displayedBadges.includes(badgeToToggle)) {
                playerData.displayedBadges = playerData.displayedBadges.filter(badgeId => badgeId !== badgeToToggle);
            } else {
                if (playerData.displayedBadges.length >= 3) {
                    followUp = "you can only display up to 3 badges! please remove one of your other badges before adding this one.";
                } else {
                    playerData.displayedBadges.push(badgeToToggle);
                }
            }

            await playerData.save();
            await interaction.update(await getShowcaseDisplay(interaction));
            if (followUp) {
                await interaction.followUp({ content: followUp, components: [new ActionRowBuilder().addComponents(okButton)] });
            }
        }
    },
    buttons: {
        "delete": async (interaction) => {
            await interaction.update({ content: "(bye!)", components: [] });
            await interaction.deleteReply(interaction.message);
        }
    },
    modals: {
        "create": async (interaction) => {
            const name = interaction.fields.getTextInputValue('badgeNameInput');
            const emoji = interaction.fields.getTextInputValue('badgeEmojiInput');
            const description = interaction.fields.getTextInputValue('badgeDescriptionInput');
            const flavorText = interaction.fields.getTextInputValue('badgeFlavorTextInput');

            const newBadge = await database.Badge.create({
                name,
                emoji,
                description,
                flavorText,
            });

            await interaction.reply({ content: `successfully created the badge ${badgeDisplay(newBadge, true)}!`, flags: MessageFlags.Ephemeral });
        }
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getString('badge');
        const badges = await database.Badge.findAll({
            where: {
                name: {
                    [Op.substring]: `${focusedValue}`
                }
            },
            limit: 25,
        });

        const options = [];
        for (const badge of badges) {
            options.push({
                name: badge.name,
                value: badge.dbId,
            });
        }

        await interaction.respond(options);
    }
}

async function getShowcaseDisplay(interaction) {
    const player = await database.Player.findByPk(`${interaction.user.id}`);

    if (!player) {
        return { content: 'you don\'t have a profile yet. try /ping instead of this command', flags: MessageFlags.Ephemeral };
    }

    const badges = await database.Badge.findAll({
        where: { dbId: player.badges },
    });

    if (badges.length === 0) {
        return { content: `${getEmoji('badge_empty')} you don't have any badges...`, flags: MessageFlags.Ephemeral };
    }

    let description = `choose which badges to display (**${player.displayedBadges.length}/3**)...\npreview: ${await player.getUserDisplay(interaction.client, database)}\n\n`;

    const dropdown = new StringSelectMenuBuilder()
        .setCustomId('showcase:badgeSelect')
        .setPlaceholder('choose a badge to toggle...');

    for (const badge of badges) {
        dropdown.addOptions({
            label: `${badge.name}`,
            value: `${badge.dbId}`,
            emoji: getEmoji(badge.emoji),
        });
        description += `${badgeDisplay(badge,true)} (${player.displayedBadges.includes(badge.dbId) ? 'displayed' : 'not displayed'})\n`;
    }

    const row = new ActionRowBuilder().addComponents(dropdown);

    const embed = new EmbedBuilder()
        .setColor('#6b8fe3')
        .setDescription(description.trim());

    return { embeds: [embed], components: [row] };
}

function badgeDisplay(dbBadge, short = false) {
    if (short) {
        return `${getEmoji(dbBadge.emoji)} ${dbBadge.name}`;
    }

    const display = 
`${getEmoji(dbBadge.emoji)} **${dbBadge.name}**
*"${dbBadge.flavorText}"*
${dbBadge.description}`;

    return display;
}