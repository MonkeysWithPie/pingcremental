const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, InteractionContextType } = require("discord.js");
const database = require("../helpers/database");
const formatNumber = require("../helpers/formatNumber");
const ping = require("../helpers/pingCalc");

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
        run: async (interaction) => {
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
            
            if (interaction.client.ws.ping === -1) {
                return interaction.reply({
                    content: "the bot just restarted! wait just a moment before you autoping...",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("autoping:run")
                .setTitle("autoping")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("value")
                            .setLabel("autoping count")
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(`input a number up to ${player.apt} or "ALL"...`)
                    )
                );
            await interaction.showModal(modal);
        }
    },
    modals: {
        run: async (interaction) => {
            if (usersAutopinging.includes(interaction.user.id)) {
                return interaction.reply({
                    content: "you are already autopinging!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            
            const player = await database.Player.findByPk(interaction.user.id);

            let pings;
            if (interaction.fields.getTextInputValue("value").toLowerCase() === "all") {
                pings = player.apt;
            } else {
                pings = parseInt(interaction.fields.getTextInputValue("value"));
            }

            if (isNaN(pings)) {
                return interaction.reply({
                    content: "please input a number...",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (pings < 1 || pings > player.apt) {
                return interaction.reply({
                    content: `please input a number between 1 and ${player.apt}.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("autopinging...")
                .setDescription(`autoping is running!\n**0**/${formatNumber(pings)}...`)
                .setColor("#c4bf18")
            
            await interaction.update({
                embeds: [embed],
                components: [],
            })

            usersAutopinging.push(interaction.user.id);

            let updateEmbedEvery = Math.ceil(pings / (5 + (Math.random() * Math.log2(pings))));
            if (updateEmbedEvery <= 1) updateEmbedEvery = pings;

            let pingDataTotal = {
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
                    embed.setDescription(`autoping is running!\n**${formatNumber(i)}**/${formatNumber(pings)}...`);
                    await interaction.editReply({ embeds: [embed] });
                    nextUpdate += updateEmbedEvery + Math.ceil(Math.random() - 0.5 * pings / 1000);
                }

                const {score, currentEffects, cache} = await ping(interaction, nextPingBlue, { autopinging: true, blueCombo: currentChain, artisanClickedSymbol: nextPingArtisan, cache: storedCache, skipDisplays: true });
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

                if (currentEffects.artisanClickedSymbol) {
                    nextPingArtisan = currentEffects.artisanNextSymbols[0];
                }

                if (i === pings - 1) {
                    finalEffects = currentEffects;
                }
            }

            const endTime = process.hrtime.bigint();

            // wow that's a lot of stats
            player.apt -= pings;

            player.score += pingDataTotal.score;
            player.totalScore += pingDataTotal.score;
            player.clicks += pings;
            player.totalClicks += pings;
            player.bp = Math.min(player.bp + pingDataTotal.bp, finalEffects.bpMax);
            player.luckyPings += pingDataTotal.rares;
            player.bluePings += pingDataTotal.blues;
            player.bluePingsMissed += pingDataTotal.bluesMissed;
            if (pingDataTotal.highestBlueCombo > player.highestBlueStreak) {
                player.highestBlueStreak = pingDataTotal.highestBlueCombo;
            }
            player.lastPing = Date.now();

            await player.save();

            
            let finalDescription =
`**${formatNumber(pings)}** pings completed, which...

__gained **\`${formatNumber(pingDataTotal.score, true, 4)} pts\`**__
got **\`${formatNumber(pingDataTotal.highestScore, true, 3)} pts\`** at most, **\`${formatNumber(pingDataTotal.worstScore, true, 3)} pts\`** at worst`;

            if (pingDataTotal.bp > 0) { 
                if (player.bp >= finalEffects.bpMax) {
                    finalDescription += `\ngained **${formatNumber(pingDataTotal.bp, true, 4)}** BP (hit MAX of ${formatNumber(finalEffects.bpMax, true, 4)})`;
                } else {
                    finalDescription += `\ngained **${formatNumber(pingDataTotal.bp, true, 4)}** BP`
                }
            }
            if (pingDataTotal.apt > 0) finalDescription += `\nwould've found **${formatNumber(pingDataTotal.apt, true, 5)}** APT`
            
            if (pingDataTotal.blues > 0 || pingDataTotal.bluesMissed > 0) {
                finalDescription += `
clicked **${pingDataTotal.blues}** blue ping${pingDataTotal.blues === 1 ? '' : 's'}
found a **${pingDataTotal.highestBlueCombo}** blue ping chain
missed **${pingDataTotal.bluesMissed}** blue ping${pingDataTotal.bluesMissed === 1 ? '' : 's'}`
            }

            if (pingDataTotal.rares > 0) finalDescription += `\nfound **${pingDataTotal.rares}** rare ping${pingDataTotal.rares === 1 ? '' : 's'}`;

            const finalEmbed = new EmbedBuilder()
                .setTitle("autoping finished!")
                .setDescription(finalDescription)
                .setColor("#18c4bf");
            
            let footer = `finished in ${(Number(endTime - startTime) / 1e9).toFixed(3)}s `;
            if (player.apt > 0) {
                footer = `${formatNumber(player.apt)} APT remaining | ` + footer;
            }
            finalEmbed.setFooter({ text: footer });
            
            const components = [
                new ButtonBuilder()
                    .setCustomId("autoping:run")
                    .setLabel(player.apt < 1 ? "out of APT..." : "autoping again!")
                    .setStyle(player.apt < 1 ? ButtonStyle.Secondary : ButtonStyle.Success)
                    .setDisabled(player.apt < 1)
            ];
            
            // only show refresh with no APT
            if (player.apt < 1) {
                components.push(
                    new ButtonBuilder()
                        .setCustomId("autoping:refresh")
                        .setLabel("refresh")
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            usersAutopinging = usersAutopinging.filter(id => id !== interaction.user.id);

            await interaction.editReply({
                embeds: [finalEmbed],
                components: [new ActionRowBuilder().addComponents(...components)],
            });
        }
    }
}

async function getAutopingEmbed(interaction) {
    const [player, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })

    const embed = new EmbedBuilder()
        .setTitle("autoping!")
        .setDescription(`
autoping pings for you automatically and quickly! all you need is some APT to run it. some upgrades will allow you to find APT while pinging.
autoping will always press the simulated **left-most** button.
APT **cannot** be gained through autopinging, so you'll need to find it on your own.

you currently have **${formatNumber(player.apt)} APT**.`)
        .setColor("#46b019")

    const button = new ButtonBuilder()
        .setCustomId("autoping:run")
        .setLabel("autoping")
        .setDisabled(player.apt < 1)
        .setStyle(player.apt < 1 ? ButtonStyle.Secondary : ButtonStyle.Success);
    const refreshButton = new ButtonBuilder()
        .setCustomId("autoping:refresh")
        .setLabel("refresh")
        .setStyle(ButtonStyle.Secondary);

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(button, refreshButton)],
    };
}