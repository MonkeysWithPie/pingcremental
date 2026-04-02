const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, EmbedBuilder } = require('discord.js');
const database = require('./../helpers/database.js');

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
    'usesAutoclicker': {
        name: 'autoclicker usage',
        description: 'do you use an autoclicker?',
        options: [
            "no", "yes"
        ],
        default: "no",
    },
    // future settings:
    // 'numberFormat': {
    //     name: 'number format',
    //     description: 'how should large numbers be formatted by default?',
    //     options: [
    //         "suffix", "full", "scientific"
    //     ],
    //     default: "suffix",
    // },
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
            if (setting === 'usesAutoclicker' && playerData.settings.usesAutoclicker === 'no') {
                await interaction.reply({ embeds:
                    [new EmbedBuilder()
                        .setColor('#b10f0f')
                        .setTitle('wait! before you turn this on...')
                        .setDescription(
`using an autoclicker is not the intended way to play pingcremental. it's a game about clicking, after all!
however, if you choose to use one and acknowledge it by turning on this setting, please be aware that:
- the only functionality this setting provides is disabling the autoclicker detection system; there is no built-in autoclicker
- by default, leaderboards won't show people who use an autoclicker (but have a toggle to do so)
- your username will have an always-visible autoclicker icon next to it in leaderboards and profiles
- this setting will NOT be able to be disabled!!

these are meant to discourage autoclicker use, but i know that some people have busy schedules or other reasons why they might want to use one. i don't want to stop you from playing this bot, but please be honest if you do use one, so the leaderboard can feel legitimate.
(note that you don't have to turn this setting on if you use an autoclicker to avoid getting cramps and etc., as long as you could theoretically be clicking actively and have a little bit of focus on the bot.)`)
                    ],
                    components: [ new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`settings:yesautoclicker`)
                            .setLabel('understood!')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setLabel('no, wait, go back')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId(`settings:delete`)
                    )],
                })

                return;
            } else if (setting === 'usesAutoclicker' && playerData.settings.usesAutoclicker === 'yes') {
                return await interaction.update(await getMessage(interaction)); // embed was out of date
            }

            const value = settings[setting];

            if (!value) return;

            const currentIndex = value.options.indexOf(playerData.settings[setting]);
            const nextIndex = (currentIndex + 1) % value.options.length;
            playerData.settings[setting] = value.options[nextIndex];

            playerData.changed('settings', true);
            await playerData.save();
            await interaction.update(await getMessage(interaction));
        },
        'yesautoclicker': async (interaction) => {
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);
            playerData.settings.usesAutoclicker = 'yes';
            playerData.changed('settings', true);
            await playerData.save();
            await interaction.update({ content: `you've opted in to using an autoclicker. thank you for being honest!`, components: [], embeds: [] });
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

        const button = new ButtonBuilder()
                .setCustomId(`settings:switch-${key}`)
                .setLabel(value.name)
                .setStyle(ButtonStyle.Secondary);

        if (key === 'usesAutoclicker' && playerData.settings[key] === 'yes') {
            button.setDisabled(true);
        }

        buttons.push(button);

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