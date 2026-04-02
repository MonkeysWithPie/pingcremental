const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const pingMessages = require('./../helpers/pingMessage.js')
const ownerId = process.env.OWNER_ID
const formatNumber = require('./../helpers/formatNumber.js')
const ping = require('./../helpers/pingCalc.js');
const awardBadge = require('../helpers/awardBadge.js');
const { getEmbeddedCommand } = require('../helpers/embedCommand.js');
const database = require('../helpers/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ping!')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const again = new ButtonBuilder()
            .setCustomId('ping:again')
            .setLabel('ping again!')
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder()
            .addComponents(again);

        const pingmessage = pingMessages(interaction.client.ws.ping, { user: interaction.user })

        await interaction.reply({
            content: `${pingmessage}`,
            components: [row]
        });
    },
    buttons: {
        "again": (async (interaction) => {
            await pingResponse(interaction, false)
        }),
        "super": (async (interaction) => {
            await pingResponse(interaction, true)
        }),
        "delete": (async interaction => {
            await interaction.update({ content: `(bye!)`, components: [] });
            await interaction.deleteReply(interaction.message);
        }),
        "unknown": (async interaction => {
            await interaction.reply({ content: "unknown ping occurs when the bot just restarted. either something has gone horribly wrong, or something was changed! maybe some new stuff was added, maybe a bug was fixed. you can check the [github](<https://github.com/MonkeysWithPie/pingcremental/>) if you're curious. if you wait a few seconds, the ping will come back to normal.", flags: MessageFlags.Ephemeral })
        })
    }
};

async function pingResponse(interaction, isSuper = false) {
    // prevent pinging during dev mode
    const developmentMode = process.argv.includes('--dev') || process.argv.includes('-d');
    if (developmentMode && interaction.user.id !== ownerId) {
        return await interaction.update({
            content: "there's some important dev stuff going on! pings are disabled for now, but will (hopefully) be back shortly.",
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ping:again')
                    .setLabel('ping again!')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('ping:delete')
                    .setLabel('dang!')
                    .setStyle(ButtonStyle.Secondary))
            ],
        })
    }

    if (interaction.client.ws.ping === -1 && !developmentMode) { // bot just restarted
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ping:again')
                .setLabel('ping again!')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ping:unknown')
                .setLabel('unknown ms?')
                .setStyle(ButtonStyle.Secondary));
        return await interaction.update({ // return early 
            content: `${pingMessages(interaction.client.ws.ping, { user: interaction.user })}`,
            components: [row],
            embeds: [],
        })
    }

    const {score, displays, currentEffects, context} = await ping(interaction, isSuper, { developmentMode });

    const playerProfile = await database.Player.findByPk(`${interaction.user.id}`);
    const pingFormat = playerProfile.settings.pingFormat || "expanded";

    // funky specials

    if (currentEffects.specials.slumber) {
        playerProfile.slumberClicks += currentEffects.specials.slumber;
    }
    if (currentEffects.specials.glimmer) {
        playerProfile.glimmerClicks += currentEffects.specials.glimmer;
    }

    /* SAVE STATS */

    context.totalScore = playerProfile.score + score;
    const pingMessage = pingMessages(context.ping, context); // get the ping message

    // click saving
    playerProfile.clicks += 1;
    playerProfile.totalClicks += 1;
    if (playerProfile.clicks > playerProfile.totalClicks) playerProfile.totalClicks = playerProfile.clicks; // make sure total clicks is always higher than clicks
    if (currentEffects.rare) playerProfile.luckyPings += 1;
    if (currentEffects.blueCombo > playerProfile.highestBlueStreak) playerProfile.highestBlueStreak = currentEffects.blueCombo;
    if (!isSuper) {
        let missed = false;
        for (const row of interaction.message.components) {
            for (const messageButton of row.components) {
                if (messageButton.data.custom_id === 'ping:super') {
                    missed = true;
                    break;
                }
            }
        }
        if (missed) playerProfile.bluePingsMissed += 1; // if the button is still there, it means they didn't click it
    }
    if (isSuper) playerProfile.bluePings += 1;

    // score saving
    playerProfile.score += score;
    playerProfile.totalScore += score;
    if (playerProfile.highestScore < score) playerProfile.highestScore = score;

    // upgrade-specific
    if (context.specials.artisanCombo && context.specials.artisanCombo > playerProfile.highestArtisanCombo) {
        playerProfile.highestArtisanCombo = context.specials.artisanCombo;
    }
    if (context.specials.coinflipCount && context.specials.coinflipCount > playerProfile.highestCoinflipCount) {
        playerProfile.highestCoinflipCount = context.specials.coinflipCount;
    }
    if (context.specials.orchestraCombo && context.specials.orchestraCombo > playerProfile.highestOrchestraCombo) {
        playerProfile.highestOrchestraCombo = context.specials.orchestraCombo;
    }
    if (context.specials.pigScore && context.specials.pigScore > playerProfile.highestPigScore) {
        playerProfile.highestPigScore = context.specials.pigScore;
    }

    // etc
    playerProfile.bp = Math.min(currentEffects.bp + playerProfile.bp, currentEffects.bpMax);
    playerProfile.apt += currentEffects.apt || 0;
    playerProfile.lastPing = Date.now();


    // badges
    if (currentEffects.blueCombo >= 10) { 
        await awardBadge(interaction.user.id, 'blue stupor', interaction.client); 
    }
    if (currentEffects.rare) {
        await awardBadge(interaction.user.id, 'lucky', interaction.client);
    }
    if (playerProfile.totalClicks >= 10000) {
        await awardBadge(interaction.user.id, 'heavy hands', interaction.client);
    }
    if (playerProfile.clicks === 1 && score > 100000) {
        await awardBadge(interaction.user.id, 'jumpstart', interaction.client);
    }
    if (currentEffects.specials.glimmer <= -5) {
        await awardBadge(interaction.user.id, 'hall of mirrors', interaction.client);
    }
    if (currentEffects.specials.artisanCombo >= 250) {
        await awardBadge(interaction.user.id, 'craftmaster', interaction.client);
    }
    if (currentEffects.specials.orchestraCombo >= 100) {
        await awardBadge(interaction.user.id, 'maestro', interaction.client);
    }

    await playerProfile.save();

    // show upgrade popup after 150 clicks
    if (playerProfile.totalClicks === 150) {
        const button = new ButtonBuilder()
            .setLabel('that looks important...')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('ping:empty')
            .setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(button);

        return await interaction.update({
            content:
                `${pingMessage}
you have a lot of \`pts\`... why don't you go spend them over in ${getEmbeddedCommand(`upgrade`)}?`, 
            components: [disabledRow],
            embeds: [],
        })
    }

    let components = getButtonRows(currentEffects);

    if (currentEffects.rare) {
        components = [new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId('ping:again')
                .setLabel('whoa!')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),
            )];
    }

    let displayDisplay = ""
    for (const dispType of ['add', 'mult', 'exponents', 'extra']) {
        const display = displays[dispType];
        if (display.length === 0) continue; // skip empty displays
        displayDisplay += ", " + formatDisplay(display, pingFormat);
    }
    displayDisplay = displayDisplay.substring(2); // remove first comma and space

    if (currentEffects.bp) {
        displayDisplay += `\n-# \`${formatNumber(Math.ceil(playerProfile.bp))}/${formatNumber(currentEffects.bpMax)} bp\`${playerProfile.bp >= currentEffects.bpMax ? " **(MAX)**" : ""} `
        displayDisplay += formatDisplay(displays.bp, pingFormat);
    }

    if (currentEffects.apt) {
        displayDisplay += `\n-# \`${formatNumber(playerProfile.apt)} APT\` `
        displayDisplay += formatDisplay(displays.apt, pingFormat);
    }


    try {
        // update ping
        await interaction.update({
            content:
                `${pingMessage}
\`${formatNumber(playerProfile.score, true, 4)} pts\` (**\`+${formatNumber(score, true, 3)}\`**)\n-# ${displayDisplay}`,
            components: components,
            embeds: [],
        });
    } catch (error) {
        // automod error, since it doesn't like some messages
        if (error.code === 200000) {
            await interaction.update({
                content:
                    `this ping message is non-offensive, and contains nothing that will anger AutoMod! (${ping}ms)
\`${formatNumber(playerProfile.score, true, 4)} pts\` (**\`+${formatNumber(score, true, 3)}\`**)\n-# ${displayDisplay}`,
                components: components,
                embeds: [],
            });
        } else {
            throw error; // rethrow if not automod 
        }
    }

    if (currentEffects.rare) {
        await (new Promise(resolve => setTimeout(resolve, 2000))); // wait a bit
        await interaction.editReply({
            components: getButtonRows(currentEffects), // refresh buttons
        })
    }
}

function getButtonRows(currentEffects) {
    if (currentEffects.specials.artisan) {
        const rows = [];
        const againRow = new ActionRowBuilder();

        let ind = 0;
        for (const symbol of currentEffects.artisanNextSymbols) {
            const artisanButton = new ButtonBuilder()
                .setCustomId(`ping:again-${ind}`)
                .setLabel(`${symbol} ping again!`)
                .setStyle(ButtonStyle.Secondary);
            againRow.addComponents(artisanButton);
            ind++;
        }

        if (!(currentEffects.specials.budge) || !(currentEffects.spawnedSuper)) {
            rows.push(againRow);
        }

        if (currentEffects.spawnedSuper) {
            const superRow = new ActionRowBuilder()
            ind = 0;

            for (const symbol of currentEffects.artisanNextSymbols.reverse()) {
                const superPing = new ButtonBuilder()
                    .setCustomId(`ping:super-${ind}`)
                    .setLabel(`${symbol} blue ping!${currentEffects.blueCombo > 0 ? ` x${currentEffects.blueCombo + 1}` : ''}`)
                    .setStyle(ButtonStyle.Primary);
                superRow.addComponents(superPing);
                ind++;
            }

            rows.push(superRow);
        }

        if (currentEffects.spawnedSuper && currentEffects.specials.budge && !(currentEffects.specials.bully)) {
            rows.push(againRow);
        }

        return rows;
    }

    const row = new ActionRowBuilder();

    const again = new ButtonBuilder()
        .setCustomId('ping:again')
        .setLabel('ping again!')
        .setStyle(ButtonStyle.Secondary);

    if (!(currentEffects.specials.budge) || !(currentEffects.spawnedSuper)) {
        row.addComponents(again);
    }
    
    if (currentEffects.spawnedSuper) {
        const superPing = new ButtonBuilder()
            .setCustomId('ping:super')
            .setLabel(`blue ping!${currentEffects.blueCombo > 0 ? ` x${currentEffects.blueCombo + 1}` : ''}`)
            .setStyle(ButtonStyle.Primary);
        row.addComponents(superPing);
    }

    if (currentEffects.spawnedSuper && currentEffects.specials.budge && !(currentEffects.specials.bully)) {
        row.addComponents(again);
    }

    return [row];
}

function formatDisplay(display, format) {
    if (format === "expanded") {
        return display.join(', ');
    } else if (format === "compact") {
        return display.join(' ');
    }
}