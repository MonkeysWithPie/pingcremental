const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, ContainerBuilder, MessageFlags, SeparatorSpacingSize, StringSelectMenuBuilder } = require('discord.js');
const database = require('./../helpers/database.js');

const settings = {
    'upgradeFollowup': {
        name: 'upgrade response',
        description: 'how should the bot respond to upgrades?',
        options: [
            "regular", "ephemeral", "none"
        ],
        default: "regular",
        style: "dropdown",
    },
    'pingFormat': {
        name: 'ping format',
        description: 'how should the ping be formatted?',
        options: [
            "expanded", "compact", "compact emojiless"
        ],
        default: "expanded",
        style: "dropdown",
    },
    'updateNotification': {
        name: 'update notification',
        description: 'when should the bot alert you when it updates?',
        options: [
            "always", "everything but hotfixes", "minor and major only", "major only", "never"
        ],
        default: "major only",
        style: "dropdown",
    },
    'numberFormat': {
        name: 'number format',
        description: 'how should large numbers be formatted?',
        options: [
            "standard", "scientific", "engineering", "letters"
        ],
        default: "standard",
        style: "dropdown",
    },
    'swapCommas': {
        name: 'swap commas and periods',
        description: 'should commas be used instead of periods and vice versa when formatting numbers?',
        options: [
            "yes", "no"
        ],
        default: "no",
        style: "toggle",
    }
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
        'delete': async (interaction) => {
            await interaction.update({ content: `(bye!)`, components: [], embeds: [] });
            await interaction.deleteReply(interaction.message);
        },
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
    },
    dropdowns: {
        'switch': async (interaction, setting) => {
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);

            const value = settings[setting];
            if (!value) return;

            const selectedValue = interaction.values[0];
            if (!value.options.includes(selectedValue)) return;

            playerData.settings[setting] = selectedValue;
            playerData.changed('settings', true);
            await playerData.save();
            await interaction.update(await getMessage(interaction));
        }
    }
}

async function getMessage(interaction) {
    const playerData = await database.Player.findByPk(`${interaction.user.id}`);
    let settingsUpdated = false;
    const container = new ContainerBuilder()
        .setAccentColor(0x374152)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### settings`));

    for (const [key, value] of Object.entries(settings)) {
        if (!playerData.settings[key]) {
            playerData.settings[key] = value.default;
            settingsUpdated = true;
        }

        container.addSeparatorComponents((separator) => separator.setSpacing(SeparatorSpacingSize.Small))

        if (value.style === "dropdown") {
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**${value.name}**: ${value.description}`));

            const dropdown = new StringSelectMenuBuilder()
                .setCustomId(`settings:switch-${key}`)
                .setPlaceholder(`current: ${playerData.settings[key]}`)
                .addOptions(value.options.map((option) => {
                    return {
                        label: option,
                        value: option,
                        default: option === playerData.settings[key]
                    }
                }));
            container.addActionRowComponents((actionRow) => actionRow.addComponents(dropdown));
        }
        else if (value.style === "toggle") {
            const enabled = playerData.settings[key] === "yes";

            const button = new ButtonBuilder()
                .setCustomId(`settings:switch-${key}`)
                .setLabel(enabled ? "disable" : "enable")
                .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success);
            container.addSectionComponents((section) => section
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**${value.name}**: ${value.description}`))
                .setButtonAccessory(button)
            );
        }
    }

    if (settingsUpdated) {
        playerData.changed('settings', true);
        await playerData.save();
    }

    return { embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 };
}