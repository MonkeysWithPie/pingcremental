const database = require('./database.js')
const { rawUpgrades } = require('./upgrades.js')
const formatNumber = require('./formatNumber.js')
const { getEmoji } = require('./emojis.js');
const getLatestVersion = require('./versions.js');
const { artisanSymbols } = require('../upgrades/fabrics/skill/artisan.js');
const { PingCalculationStates } = require('./commonEnums.js');
const MAX_PING_OFFSET = 5;

async function ping(interaction, isSuper = false, overrides = {}) {
    let pingMs = interaction.client.ws.ping;
    if (overrides.developmentMode) {
        pingMs = 6; // for testing purposes; prevents too much point gain & bypasses unknown ping
    }
    pingMs += Math.round(Math.random() * MAX_PING_OFFSET * 2) - MAX_PING_OFFSET; // randomize a bit since it only updates occasionally

    const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: overrides.userId || interaction.user.id } })
    let context = { // BIG LONG EVIL CONTEXT (will kill you if it gets the chance)
        // actual context
        user: interaction.user,
        ping: pingMs,
        isSuper: isSuper,
        versionNumber: await getLatestVersion(),
        interactionTimestamp: interaction.createdAt,
        autopinging: overrides.autopinging || false,

        // player profile bits
        score: playerProfile.score,
        clicks: playerProfile.clicks,
        totalClicks: playerProfile.totalClicks,
        pip: playerProfile.pip,
        removedUpgrades: playerProfile.removedUpgrades,
        missedBluePings: playerProfile.bluePingsMissed,

        // per-upgrade vars
        slumberClicks: playerProfile.slumberClicks,
        glimmerClicks: playerProfile.glimmerClicks,
        artisanClickedSymbol: null,
        artisanNextSymbols: [],
        
        // updated vars
        spawnedSuper: false,
        rare: false,
        blue: 0,
        blueStrength: 1,
        blueCap: 35,
        specials: {},
        RNGmult: 1,
        blueCombo: 0,
        apt: 0,
        state: PingCalculationStates.RNG_AND_SPECIAL
    }

    let iterateUpgrades = {}
    for (const upgradeTypeList of [playerProfile.upgrades, playerProfile.prestigeUpgrades, playerProfile.equippedFabrics]) {
        if (!upgradeTypeList) continue;
        for (const [upg, lv] of Object.entries(upgradeTypeList)) iterateUpgrades[upg] = lv;
    }


    /* PRE-PTS CALCULATION */
    

    // prep a bunch of variables for the effects
    let currentEffects = {
        mults: [],
        exponents: [],
        blue: 0,
        blueStrength: 1,
        blueCap: 35,
        specials: {},
        bp: 0,
        apt: 0,
        RNGmult: overrides.forceNoRNG ? 0 : 1,
        // add more if needed
        
        // will be updated later
        blueCombo: 0, rare: false, spawnedSuper: false, bpMax: 10000,
    }
    let displays = {
        add: [],
        mult: [],
        exponents: [],
        extra: [],
        bp: [],
        apt: [],
    }
    const pingFormat = playerProfile.settings.pingFormat || "expanded";
    if (pingFormat === "expanded") {
        displays.add.push(`${getEmoji('ping')} \`+${pingMs}\``);
    } else if (pingFormat === "compact") {
        displays.add.push(`${getEmoji('ping')}`);
    }
    let effect;
    let score = pingMs; // base score is ping


    for (const [upgradeId, level] of Object.entries(iterateUpgrades)) {
        effect = rawUpgrades[upgradeId].getEffect(level, context);
        if (effect.special) {
            for (const [special, value] of Object.entries(effect.special)) {
                currentEffects.specials[special] = value;
            }
        }
        if (effect.blue) { 
            currentEffects.blue += effect.blue; 
            context.blue = currentEffects.blue; 
        }
        if (effect.blueStrength) { 
            currentEffects.blueStrength += effect.blueStrength; 
            context.blueStrength = currentEffects.blueStrength; 
        }
        if (effect.blueCap) {
            currentEffects.blueCap += effect.blueCap; 
            context.blueCap = currentEffects.blueCap;
        }
        if (effect.RNGmult) { 
            currentEffects.RNGmult += effect.RNGmult; 
            context.RNGmult = currentEffects.RNGmult; 
        }
    }

    currentEffects.blue = Math.min(currentEffects.blue, currentEffects.blueCap, 90); // hard cap at 90% chance or whatever the blue cap is

    if (isSuper) {
        let blueStrength = (currentEffects.blueStrength) * 15;
        currentEffects.mults.push(blueStrength);
        if (pingFormat === "expanded") {
            displays.mult.push(`${getEmoji('upgrade_blue')} __\`x${blueStrength.toFixed(2)}\`__`)
        } else if (pingFormat === "compact") {
            displays.mult.push(`${getEmoji('upgrade_blue')}`)
        }

        for (const row of interaction.message.components) {
            for (const messageButton of row.components) {
                if (messageButton.data.custom_id.startsWith('ping:super')) {
                    context.blueCombo = (parseInt(messageButton.data.label.split('x')[1]) || 1); // get the current combo
                }
            }
        }

        if (overrides.blueCombo) {
            context.blueCombo = overrides.blueCombo;
        }
    }

    if (Math.random() * 1000 < (currentEffects.blue * 10) && currentEffects.specials.blueping) {
        context.spawnedSuper = true;
    }
    if ((Math.random() * 1000 < 1 * currentEffects.RNGmult)) {
        context.rare = true;
    }

    if (currentEffects.specials.artisan) {
        const symbolMatcher = new RegExp(`[${artisanSymbols.join('')}]`);

        if (overrides.artisanClickedSymbol) {
            context.artisanClickedSymbol = overrides.artisanClickedSymbol;
        } else if (interaction.component && interaction.component.label.match(symbolMatcher)) {
            // extracts the symbol from the button label (looks gross though)
            context.artisanClickedSymbol = interaction.component.label.match(new RegExp(`[${artisanSymbols.join('')}]`))[0];
        }
        
        context.artisanNextSymbols = artisanSymbols;
        // shuffle
        for (let i = context.artisanNextSymbols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [context.artisanNextSymbols[i], context.artisanNextSymbols[j]] = [context.artisanNextSymbols[j], context.artisanNextSymbols[i]];
        }
    }
    
    context.specials = currentEffects.specials; // update context for later effects

    // add slumber clicks if offline for long enough
    if (currentEffects.specials.canGainSlumber && Date.now() - playerProfile.lastPing >= 1000 * 60 * (21 - playerProfile.upgrades.slumber)) {
        playerProfile.slumberClicks += Math.floor((Date.now() - playerProfile.lastPing) / (1000 * 60 * (21 - playerProfile.upgrades.slumber)));
        playerProfile.slumberClicks = Math.min(playerProfile.slumberClicks, Math.round((2 * 24 * 60) / (21 - playerProfile.upgrades.slumber))); // max of 2 days of slumber clicks
        playerProfile.slumberClicks = Math.max(playerProfile.slumberClicks, 0); // no negative slumber clicks
        context.slumberClicks = playerProfile.slumberClicks; // update context for later effects
    }

    
    /* PTS CALCULATION */

    
    context.state = PingCalculationStates.SCORING;
    for (const [upgradeId, level] of Object.entries(iterateUpgrades)) {
        const upgradeClass = rawUpgrades[upgradeId];
        effect = upgradeClass.getEffect(level,context);

        let effectString = upgradeClass.getDetails().emoji;

        // apply effects where appropriate
        if (effect.add && effect.add !== 0) {
            score += effect.add;
        }

        if (effect.multiply && effect.multiply !== 1) {
            currentEffects.mults.push(effect.multiply);
        }

        if (effect.exponent && effect.exponent !== 1) {
            currentEffects.exponents.push(effect.exponent);
        }

        if (effect.special) { 
            for (const [special, value] of Object.entries(effect.special)) {
                if (!currentEffects.specials[special]) currentEffects.specials[special] = value;
            }
        }

        effectString = formatEffect(effect, upgradeClass, pingFormat);

        // add to display
        if (effectString) {
            if (effect.add) {
                displays.add.push(effectString);
            } else if (effect.multiply) {
                displays.mult.push(effectString);
            } else if (effect.exponent) {
                displays.exponents.push(effectString);
            } else if (effect.message) {
                displays.extra.push(effectString);
            }
        }
    }

    score = Math.max(score, 1); // prevent negative scores

    let totalMult = 1;
    // add mults at the end so they're actually effective
    for (const mult of currentEffects.mults) {
        score *= mult;
        totalMult *= mult;
    }

    if (totalMult > 1 && pingFormat !== "expanded") {
        displays.mult.push(`__\`x${formatNumber(Math.floor(totalMult))}${(totalMult % 1).toFixed(2).slice(1)}\`__`);
    }

    let totalExp = 1;
    for (const exponent of currentEffects.exponents) {
        score = Math.pow(score, exponent);
        totalExp *= exponent;
    }

    if (totalExp > 1 && pingFormat !== "expanded") {
        displays.exponents.push(`**__\`^${totalExp.toFixed(3)}\`__**`);
    }

    score = Math.round(score);
    if (score === Infinity) score = 0; // prevent infinite score (and fuck you; you get nothing)
    context.score = score; // update context for later effects


    /* POST-PTS CALCULATION */
    // this is done for things that require pt values after most calculation is already done
    

    context.state = PingCalculationStates.POST_SCORING;
    for (const [upgradeId, level] of Object.entries(iterateUpgrades)) {
        const upgradeClass = rawUpgrades[upgradeId];
        effect = upgradeClass.getEffect(level, context);

        if (effect.bp) { 
            currentEffects.bp += effect.bp;
            displays.bp.push(formatEffect(effect, upgradeClass, pingFormat));
        }
        if (effect.apt) {
            currentEffects.apt += effect.apt;
            displays.apt.push(formatEffect(effect, upgradeClass, pingFormat))
        }
    }

    if (currentEffects.specials.rerolls && !overrides.skipRerolls) {
        if (Math.random() < currentEffects.specials.rerolls % 1) {
            currentEffects.specials.rerolls++;
        }
        currentEffects.specials.rerolls = Math.floor(currentEffects.specials.rerolls);

        for (let i = 0; i < currentEffects.specials.rerolls; i++) {
            const reroll = await ping(interaction, isSuper, { skipRerolls: true });
            if (reroll.score > score) {
                score = reroll.score;
                displays = reroll.displays;
                currentEffects = reroll.currentEffects;
                context = reroll.context;
            }
        }
    }

    if (pingFormat !== "expanded") {
        displays.add.push(`\`+${formatNumber(score)}\``);
        if (currentEffects.bp) {
            displays.bp.push(`\`+${formatNumber(currentEffects.bp)} bp\``);
        }
        if (currentEffects.apt) {
            displays.apt.push(`\`+${formatNumber(currentEffects.apt)} APT\``);
        }
    }
    
    let bpMax = ((playerProfile.upgrades.limit || 0) + 1) * 10000;
    bpMax *= (playerProfile.prestigeUpgrades.storage || 0) * 0.2 + 1;

    // move all the spare stuff into currentEffects so it's nice and organized
    for (const x of ['spawnedSuper', 'rare', 'blueCombo', 'artisanNextSymbols']) {
        currentEffects[x] = context[x]
    }
    currentEffects.bpMax = bpMax;

    return {
        score,
        displays,
        currentEffects,
        context,
    }
}

function formatEffect(effect, upgradeClass, format) {
    let effectString = upgradeClass.getDetails().emoji;

    if (effect.add && effect.add !== 0) {
        effectString += ` \`${effect.add >= 0 ? "+" : ""}${formatNumber(effect.add)}\``;
    }
    if (effect.multiply && effect.multiply !== 1) {
        effectString += ` __\`x${formatNumber(Math.floor(effect.multiply))}${(effect.multiply % 1).toFixed(2).slice(1)}\`__`;
    }
    if (effect.exponent && effect.exponent !== 1) {
        effectString += ` **__\`^${effect.exponent.toFixed(3)}\`__**`;
    }
    if (effect.bp) {
        effectString += ` \`+${formatNumber(effect.bp)} bp\``;
    }
    if (effect.apt) {
        effectString += ` \`+${formatNumber(effect.apt)} APT\``;
    }

    if (format === "compact" && effectString !== upgradeClass.getDetails().emoji) {
        effectString = `${upgradeClass.getDetails().emoji}Ñ`;
    }

    // bypasses compact mode
    if (effect.message) { effectString += ` ${effect.message}`; }

    if (format === "compact emojiless") {
        effectString = "";
    }

    if (effectString !== upgradeClass.getDetails().emoji && effectString !== "") {
        if (effectString.includes("Ñ")) {
            effectString = effectString.replace("Ñ", "");
        }
        return effectString;
    }

    return null
}

module.exports = ping;