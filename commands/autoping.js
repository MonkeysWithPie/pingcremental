const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, InteractionContextType, LabelBuilder, ContainerBuilder, SeparatorSpacingSize } = require("discord.js");
const database = require("../helpers/database");
const formatNumber = require("../helpers/formatNumber");
const ping = require("../helpers/pingCalc");
const betaMode = process.env.BETA_TEST === 'true';

// autopinging multiple times can cause issues, so this keeps track of userIDs
let usersAutopinging = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoping")
        .setDescription("ping a ton for you, automatically")
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),

    async execute(interaction) {
        await interaction.reply(await getAutopingEmbed(interaction));
    },
    buttons: {
        refresh: async (interaction) => {
            await interaction.update(await getAutopingEmbed(interaction));
        },
        run: async (interaction, count) => {
            if (usersAutopinging.includes(interaction.user.id)) {
                return interaction.reply({
                    content: "you are already autopinging!",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const player = await database.Player.findByPk(interaction.user.id);
            if (player.apt < 1) {
                return interaction.reply({
                    content: "you don't have any APT...",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const developmentMode = process.argv.includes('--dev') || process.argv.includes('-d');
            if (interaction.client.ws.ping === -1 && !developmentMode) {
                return interaction.reply({
                    content: "the bot just restarted! wait just a moment before you autoping...",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (developmentMode && interaction.user.id !== process.env.OWNER_ID) {
                return interaction.reply({
                    content: "not right now!",
                    flags: MessageFlags.Ephemeral,
                });
            }

            // for quick repeats ("100x more!")
            if (count) {
                return doAutoping(interaction, count);
            }

            const modal = new ModalBuilder()
                .setCustomId("autoping:run")
                .setTitle("autoping")
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("autoping count")
                        .setDescription(`up to ${formatNumber(player.apt, { shortHand: false, options: player.formatSettings })} or "ALL"`)
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Short)
                                .setCustomId("value")
                        )
                );
            await interaction.showModal(modal);
        }
    },
    modals: {
        run: async (interaction) => {
            await doAutoping(interaction, interaction.fields.getTextInputValue("value").toLowerCase());
        }
    }
}

async function doAutoping(interaction, count) {
    if (usersAutopinging.includes(interaction.user.id)) {
        return interaction.reply({
            content: "you are already autopinging!",
            flags: MessageFlags.Ephemeral,
        });
    }

    let player = await database.Player.findByPk(interaction.user.id);

    let pings;
    if (count === "all") {
        pings = player.apt;
    } else {
        pings = parseInt(count);
    }

    if (isNaN(pings)) {
        return interaction.reply({
            content: "please input a number...",
            flags: MessageFlags.Ephemeral,
        });
    }
    if (pings < 1 || pings > player.apt) {
        return interaction.reply({
            content: `please input a number between 1 and ${formatNumber(player.apt, { options: player.formatSettings })}.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    function buildAutopingContainer(progress) {
        const container = new ContainerBuilder()
            .setAccentColor(0xc4bf18)
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(`### autopinging...\n**${formatNumber(progress, { shortHand: false, options: player.formatSettings })}**/${formatNumber(pings, { shortHand: false, options: player.formatSettings })}...`)
            )
        return container
    }


    await interaction.update({
        embeds: [],
        components: [buildAutopingContainer(0)],
        flags: MessageFlags.IsComponentsV2,
    })

    usersAutopinging.push(interaction.user.id);

    let updateEmbedEvery = Math.ceil(pings / (4 + (Math.random() * Math.log10(pings))));
    if (updateEmbedEvery <= 1) updateEmbedEvery = pings;

    const pingDataTotal = {
        score: 0,
        highestScore: 0,
        worstScore: Infinity,
        bp: 0,
        apt: 0,

        rares: 0,
        blues: 0,
        bluesMissed: 0,
        highestBlueCombo: 0,
    }
    let storedCache = null;
    let nextPingBlue = false;
    let nextPingArtisan = null;
    let currentChain = 0;
    let finalEffects;
    let nextUpdate = updateEmbedEvery;

    const startTime = process.hrtime.bigint();

    for (let i = 0; i < pings; i++) {
        if (i === nextUpdate) {
            await interaction.editReply({ components: [buildAutopingContainer(i)] });
            await new Promise(r => setTimeout(r, 400)); // short delay to avoid rate limits
            nextUpdate += updateEmbedEvery + Math.ceil(Math.random() - 0.5 * pings / 1000); // some variance, for fun
        }

        const { score, currentEffects, cache } = await ping(interaction, nextPingBlue, {
            autopinging: true,
            blueCombo: currentChain,
            artisanClickedSymbol: nextPingArtisan,
            cache: storedCache,
            skipDisplays: true
        });
        nextPingBlue = currentEffects.spawnedSuper && currentEffects.specials.budge;
        storedCache = cache;

        pingDataTotal.score += score;
        pingDataTotal.highestScore = Math.max(pingDataTotal.highestScore, score);
        pingDataTotal.worstScore = Math.min(pingDataTotal.worstScore, score);
        pingDataTotal.bp += currentEffects.bp || 0;
        pingDataTotal.apt += currentEffects.apt || 0;

        if (currentEffects.spawnedSuper && currentEffects.specials.budge) {
            currentChain++;
            pingDataTotal.blues++;
            pingDataTotal.highestBlueCombo = Math.max(pingDataTotal.highestBlueCombo, currentChain);
        } else {
            currentChain = 0;
        }
        pingDataTotal.bluesMissed += currentEffects.spawnedSuper && !currentEffects.specials.budge ? 1 : 0;
        pingDataTotal.rares += currentEffects.rare ? 1 : 0;

        storedCache.profile.slumberClicks += currentEffects.slumberClicks || 0;
        storedCache.profile.glimmerClicks += currentEffects.glimmerClicks || 0;

        if (currentEffects.artisanClickedSymbol) {
            nextPingArtisan = currentEffects.artisanNextSymbols[0];
        }

        if (i === pings - 1) {
            finalEffects = currentEffects;
        }
    }

    const endTime = process.hrtime.bigint();

    // re-fetch in case stats changed while autoping was active
    player = await database.Player.findByPk(interaction.user.id);

    player.slumberClicks += Math.max(storedCache.profile.slumberClicks, 0);
    player.glimmerClicks += Math.max(storedCache.profile.glimmerClicks, 0);

    // wow that's a lot of stats
    player.apt -= pings;

    const stats = await player.stats();

    player.score += pingDataTotal.score;

    for (const layerStat of Object.values(stats)) {
        if (pingDataTotal.highestScore > layerStat.highestScore)
            layerStat.highScore = pingDataTotal.highestScore;

        if (pingDataTotal.highestBlueCombo > layerStat.highestBlueStreak)
            layerStat.blueStreak = pingDataTotal.highestBlueCombo;

        if (layerStat.changed()) await layerStat.save();
    }

    player.increaseStat('clicks', pings);
    player.increaseStat('aptClicks', pings);
    player.bp = Math.min(player.bp + pingDataTotal.bp, finalEffects.bpMax);
    player.increaseStat('luckyPings', pingDataTotal.rares);
    player.increaseStat('bluePings', pingDataTotal.blues);
    player.increaseStat('bluePingsMissed', pingDataTotal.bluesMissed);

    await player.save();
    await refreshAPT(player);

    const formatSettings = { decimalPlaces: 4, options: player.formatSettings }

    let finalDescription =
        `**${formatNumber(pings, { shortHand: false, options: player.formatSettings })}** pings completed, which...

__gained **\`${formatNumber(pingDataTotal.score, formatSettings)} pts\`**__
got **\`${formatNumber(pingDataTotal.highestScore, { decimalPlaces: 3, options: player.formatSettings })} pts\`** at most, **\`${formatNumber(pingDataTotal.worstScore, { decimalPlaces: 3, options: player.formatSettings })} pts\`** at worst`;

    if (pingDataTotal.bp > 0) {
        if (player.bp >= finalEffects.bpMax) {
            finalDescription += `\ngained **${formatNumber(pingDataTotal.bp, formatSettings)}** BP (hit MAX of ${formatNumber(finalEffects.bpMax, formatSettings)})`;
        } else {
            finalDescription += `\ngained **${formatNumber(pingDataTotal.bp, formatSettings)}** BP`
        }
    }
    if (pingDataTotal.apt > 0) finalDescription += `\nwould've found **${formatNumber(pingDataTotal.apt, { decimalPlaces: 5, options: player.formatSettings })}** APT`

    if (pingDataTotal.blues > 0 || pingDataTotal.bluesMissed > 0) {
        finalDescription += `
clicked **${pingDataTotal.blues}** blue ping${pingDataTotal.blues === 1 ? '' : 's'}
found a **${pingDataTotal.highestBlueCombo}** blue ping chain
missed **${pingDataTotal.bluesMissed}** blue ping${pingDataTotal.bluesMissed === 1 ? '' : 's'}`
    }

    if (pingDataTotal.rares > 0) finalDescription += `\nfound **${pingDataTotal.rares}** rare ping${pingDataTotal.rares === 1 ? '' : 's'}`;

    const finalContainer = new ContainerBuilder()
        .setAccentColor(0x18c4bf)
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`### autoping finished!
${finalDescription}`)
        )

    let footer = `-# finished in ${(Number(endTime - startTime) / 1e9).toFixed(3)}s `;
    if (player.apt > 0) {
        footer = `you have **${formatNumber(player.apt, { options: player.formatSettings })}** APT left.\n` + footer;
    }
    finalContainer.addSeparatorComponents((separator) =>
        separator.setSpacing(SeparatorSpacingSize.Small)
    ).addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`${footer}`)
    )

    const components = [
        new ButtonBuilder()
            .setCustomId("autoping:run")
            .setLabel(player.apt < 1 ? "out of APT..." : "autoping again!")
            .setStyle(player.apt < 1 ? ButtonStyle.Secondary : ButtonStyle.Success)
            .setDisabled(player.apt < 1)
    ];

    if (player.apt >= pings) {
        components.push(
            new ButtonBuilder()
                .setCustomId(`autoping:run-${pings}`)
                .setLabel(`${formatNumber(pings, { options: player.formatNumber })}x more!`)
                .setStyle(ButtonStyle.Secondary)
        );
    }

    // only show refresh with no APT
    if (player.apt < 1) {
        components.push(
            new ButtonBuilder()
                .setCustomId("autoping:refresh")
                .setLabel("refresh")
                .setStyle(ButtonStyle.Secondary)
        );
    }

    finalContainer.addActionRowComponents((actionRow) =>
        actionRow.setComponents(components)
    )

    usersAutopinging = usersAutopinging.filter(id => id !== interaction.user.id);

    await interaction.editReply({
        components: [finalContainer],
    });
}

async function getAutopingEmbed(interaction) {
    const [player,] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })

    await refreshAPT(player);

    const button = new ButtonBuilder()
        .setCustomId("autoping:run")
        .setLabel("autoping")
        .setDisabled(player.apt < 1)
        .setStyle(player.apt < 1 ? ButtonStyle.Secondary : ButtonStyle.Success);
    const refreshButton = new ButtonBuilder()
        .setCustomId("autoping:refresh")
        .setLabel("refresh")
        .setStyle(ButtonStyle.Secondary);

    const container = new ContainerBuilder()
        .setAccentColor(0x46b019)
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`### autoping!
autoping pings for you automatically and quickly! all you need is some APT to run it. some upgrades will allow you to find APT while pinging.
autoping will always press the simulated **left-most** button.
APT **cannot** be gained through autopinging, so you'll need to find it on your own.`)
        )
        .addSeparatorComponents((separator) =>
            separator.setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`you currently have **${formatNumber(player.apt, { options: player.formatSettings })} APT**.`)
        )
        .addActionRowComponents((actionRow) =>
            actionRow.setComponents(button, refreshButton)
        )

    return {
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };
}

async function refreshAPT(player) {
    if (!betaMode) return;
    player.apt = Math.max(player.apt, 100);
    await player.save();
}