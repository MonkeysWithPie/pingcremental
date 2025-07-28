const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder } = require('discord.js');
const database = require('./../helpers/database.js');
const log = require('./../helpers/log.js');

const settings = {
    'upgradeFollowup': {
        name: 'upgrade response',
        description: 'how should the bot respond to upgrades?',
        options: [
            "regular", "ephemeral", "none"
        ],
        default: "regular",
    },
    'pingFormat': {
        name: 'ping format',
        description: 'how should the ping be formatted?',
        options: [
            "expanded", "compact", "compact emojiless"
        ],
        default: "expanded",
    },
    'updateNotification': {
        name: 'update notification',
        description: 'when should the bot alert you when it updates?',
        options: [
            "always", "everything but hotfixes", "minor and major only", "major only", "never"
        ],
        default: "major only",
    },
    'numberFormat': {
        name: 'number format',
        description: 'how should large numbers be formatted by default?',
        options: [
            "suffix", "full", "scientific"
        ],
        default: "suffix",
    },
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('change how stuff works')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply(await getMessage(interaction));
    },
    buttons: {
        'switch': async (interaction, setting) => {
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);
            const value = settings[setting];

            if (!value) return;

            const currentIndex = value.options.indexOf(playerData.settings[setting]);
            const nextIndex = (currentIndex + 1) % value.options.length;
            playerData.settings[setting] = value.options[nextIndex];

            playerData.changed('settings', true);
            await playerData.save();
            await interaction.update(await getMessage(interaction));
        }
    }
}

async function getMessage(interaction) {
    const playerData = await database.Player.findByPk(`${interaction.user.id}`);
    const buttons = [];
    let description = ""
    let settingsUpdated = false;

    for (const [key, value] of Object.entries(settings)) {
        if (!playerData.settings[key]) {
            playerData.settings[key] = value.default;
            settingsUpdated = true;
        }

        buttons.push(
            new ButtonBuilder()
                .setCustomId(`settings:switch-${key}`)
                .setLabel(value.name)
                .setStyle(ButtonStyle.Secondary)
        );

        description += `
**${value.name}**: ${value.description}\n`
        description += value.options.map((option) => {
            const bold = playerData.settings[key] === option ? '__' : '';
            return `${bold}${option}${bold}`;
        }).join(' | ') + '\n';
    }

    if (settingsUpdated) {
        playerData.changed('settings', true);
        await playerData.save();
    }

    // TODO: make separate action rows for >5 settings
    const row = new ActionRowBuilder()
        .addComponents(buttons);

    const embed = new EmbedBuilder()
        .setColor('#374152')
        .setTitle('settings')
        .setDescription(description.trim())

    return { embeds: [embed], components: [row] };
}