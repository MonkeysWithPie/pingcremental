const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
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
        description += `${getEmoji(badge.emoji)} ${badge.name} (${player.displayedBadges.includes(badge.dbId) ? 'displayed' : 'not displayed'})\n`;
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