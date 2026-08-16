const formatNumber = require("../helpers/formatNumber");
const { rawUpgrades, upgrades } = require("../helpers/upgrades");
const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionContextType, ContainerBuilder, SectionBuilder, SeparatorSpacingSize, TextDisplayBuilder } = require("discord.js");
const database = require("../helpers/database");
const RandSeed = require("rand-seed").default;
const awardBadge = require("../helpers/awardBadge.js");

const WEAVE_SECTION = {
    Tear: 'tear',
    Shop: 'weave',
    Cloths: 'fabrics',
    Cloak: 'cloak',
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("weave")
        .setDescription("weave the fabric of the universe itself...?")
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        return await interaction.reply(await getEmbed(interaction));
    },
    buttons: {
        section: async (interaction, newSection) => {
            return await interaction.update(await getEmbed(interaction, newSection));
        },
        reset: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const stats = await player.stats();

            if (stats.tear.eternities < getTearRequirement(stats.total.tears)) {
                return await interaction.reply({
                    content: `you can't.... what?`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const gainedThread = getGainedThread(player);
            const gainedThreadDetailed = getGainedThread(player, false);

            player.increaseStat("tears");
            player.thread += gainedThread;
            player.cloakModificationsAllowed = 1;
            if (stats.total.tears !== 0) player.shopSeed = getNewSeed();
            player.shopEmptySlots = [];
            player.shopRerolls = 0;

            player.upgrades = {};
            player.score = 0;
            player.glimmerClicks = 0;
            player.slumberClicks = 0;

            player.bp = 0;
            player.pip = 0;
            player.prestigeUpgrades = {};
            
            await player.save();
            await player.layerReset('tear');

            await awardBadge(interaction.user.id, 'interwoven', interaction.client);

            if (gainedThread - gainedThreadDetailed.tears <= 110) {
                await awardBadge(interaction.user.id, 'threadbare', interaction.client);
            }

            await interaction.update(await getEmbed(interaction, WEAVE_SECTION.Tear));
            return await interaction.followUp({
                content: `you tear the universe, and gained **${formatNumber(gainedThread, { options: player.formatSettings })}** thread (now ${formatNumber(player.thread, { options: player.formatSettings })} total).`,
                flags: MessageFlags.Ephemeral
            });
        },
        breakdown: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const breakdown = getGainedThread(player, false);

            let desc = `you will gain ${formatNumber(getGainedThread(player), { options: player.formatSettings })} thread for tearing the universe, given by the following:\n`;
            desc += `\n**base**: ${breakdown.base} (always given regardless)`;
            if (breakdown.pts) {
                desc += `\n**owned \`pts\`**: ${formatNumber(breakdown.pts, { options: player.formatSettings })} (1 per every digit in your owned \`pts\`)`;
            }
            if (breakdown.pip) {
                desc += `\n**owned pip**: ${formatNumber(breakdown.pip, { options: player.formatSettings })} (2 per every digit in your owned pip)`;
            }
            if (breakdown.eternities) {
                desc += `\n**eternities**: ${formatNumber(breakdown.eternities, { options: player.formatSettings })} (1 per every eternity beyond the requirement, up to 15)`;
            }
            if (breakdown.tears) {
                desc += `\n**previous tears**: ${formatNumber(breakdown.tears, { options: player.formatSettings })} (3 per every previous tear, up to 30)`;
            }

            return await interaction.reply({
                content: desc,
                flags: MessageFlags.Ephemeral
            });
        },
        delete: async (interaction) => {
            await interaction.update({ content: "(vwoop!)", components: [] });
            await interaction.deleteReply(interaction.message);
        },
        sew: async (interaction) => {
            await interaction.reply(await getSewEmbed(interaction));
        },
        sewRemove: async (interaction, fabricName) => {
            const equippedFabrics = getEquippedFromSewMessage(interaction.message);

            equippedFabrics[fabricName]--;
            if (equippedFabrics[fabricName] <= 0) {
                delete equippedFabrics[fabricName];
            }

            await interaction.update(await getSewEmbed(interaction, equippedFabrics));
        },
        sewFinish: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const response = await getSewEmbed(interaction, getEquippedFromSewMessage(interaction.message), "confirm");

            await interaction.update(response);

            await interaction.followUp({
                content: `are you sure you want to sew your cloak with the selected fabrics? this will replace your current cloak. you will have ${player.cloakModificationsAllowed - 1} modification${player.cloakModificationsAllowed - 1 === 1 ? "" : "s"} remaining after this.`,
                flags: MessageFlags.Ephemeral,
            })
        },
        sewFinishConfirm: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const equippedFabrics = getEquippedFromSewMessage(interaction.message);

            player.equippedFabrics = equippedFabrics;
            player.changed('equippedFabrics', true);
            player.cloakModificationsAllowed--;

            await player.save();
            
            await interaction.update(await getSewEmbed(interaction, equippedFabrics, "final"));
            return await interaction.followUp({
                content: `your cloak has been sewn with the selected fabrics!`,
                flags: MessageFlags.Ephemeral
            });
        },
        sewCancel: async (interaction) => {
            await interaction.update({
                components: [
                    new TextDisplayBuilder()
                        .setContent(`cloak sewing cancelled.`)
                ],
                embeds: [],
                flags: MessageFlags.Ephemeral
            })

            await new Promise(resolve => setTimeout(resolve, 4000));
            await interaction.deleteReply(interaction.message);
        },
        shopReroll: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);

            if (player.thread < 5 ** player.shopRerolls * 20) {
                return await interaction.reply({
                    content: `you don't have enough thread to reroll the shop!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            player.thread -= 5 ** player.shopRerolls * 20;
            player.shopRerolls++;
            player.shopSeed = getNewSeed();
            player.shopEmptySlots = [];
            await player.save();

            await interaction.update(await getEmbed(interaction, WEAVE_SECTION.Shop));
        },
        buy: async (interaction, fabricName) => {
            if (!rawUpgrades[fabricName]) {
                return await interaction.reply({
                    content: `this fabric doesn't exist?`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const fabricUpgrade = rawUpgrades[fabricName];
            const player = await database.Player.findByPk(interaction.user.id);

            if (player.thread < fabricUpgrade.getPrice()) {
                const msg = ['dang it!', 'oh noes!', 'oopsies!', 'shoot!']

                return await interaction.reply({
                    content: `you don't have enough thread for this fabric!`,
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`weave:delete`)
                            .setLabel(msg[Math.floor(Math.random() * msg.length)])
                            .setStyle(ButtonStyle.Secondary)
                    )],
                });
            }

            // because sequelize doesn't like modifying lists directly
            const currentEmpty = player.shopEmptySlots || [];
            currentEmpty.push(getShopStock(player.shopSeed).indexOf(fabricName));

            player.thread -= fabricUpgrade.getPrice();
            player.ownedFabrics[fabricName] = (player.ownedFabrics[fabricName] || 0) + 1;
            player.changed('ownedFabrics', true); // actually make it get saved because... json objects
            player.shopEmptySlots = currentEmpty;

            await player.save();

            await interaction.update(await getEmbed(interaction, WEAVE_SECTION.Shop));

            const msg = ['hell yeah!', 'woo!', 'okay!']
            await interaction.followUp({
                content: `you got **${fabricUpgrade.getDetails().name}** in exchange for **${formatNumber(fabricUpgrade.getPrice(), { options: player.formatSettings })}** thread!`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`weave:delete`)
                        .setLabel(msg[Math.floor(Math.random() * msg.length)])
                        .setStyle(ButtonStyle.Secondary)
                )]
            })
        }
    },
    dropdowns: {
        sewAdd: async (interaction) => {
            const fabricName = interaction.values[0];
            if (fabricName === "none") return await interaction.reply({ content: 'you already got everything!', flags: MessageFlags.Ephemeral });

            const equippedFabrics = getEquippedFromSewMessage(interaction.message);

            equippedFabrics[fabricName] = (equippedFabrics[fabricName] || 0) + 1;

            await interaction.update(await getSewEmbed(interaction, equippedFabrics));
        },
    },
    getTearRequirement,
}

async function getEmbed(interaction, section = WEAVE_SECTION.Shop) {
    const [player, ] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });
    const stats = await player.stats();

    if (stats.total.tears <= 0 && stats.tear.eternities < getTearRequirement(0)) {
        return { 
            content: "*you'd love to try weaving... but regular old cloaks and quilts aren't going to do you any good in your pts gathering. maybe there's something more fundamental you're missing?*", 
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`weave:delete`)
                    .setLabel("hm...!")
                    .setStyle(ButtonStyle.Secondary)
            )],
        };
    }

    const availableSections = [WEAVE_SECTION.Tear]

    const container = new ContainerBuilder()
        .setAccentColor(0x120830)

    const categoryRow = new ActionRowBuilder();
    
    if (stats.total.tears > 0) {
        availableSections.push(WEAVE_SECTION.Shop);
    } else {
        section = WEAVE_SECTION.Tear; // force this section with no previous tears, since they'll need to do this first
    }
    if (Object.keys(player.ownedFabrics).length > 0) {
        availableSections.push(WEAVE_SECTION.Cloths, WEAVE_SECTION.Cloak);
    }

    for (const sectionName of availableSections) {
        categoryRow.addComponents(new ButtonBuilder()
            .setCustomId(`weave:section-${sectionName}`)
            .setLabel(sectionName)
            .setStyle(section === sectionName ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    }
    for (const sectionName of Object.values(WEAVE_SECTION)) {
        if (!availableSections.includes(sectionName)) {
            categoryRow.addComponents(new ButtonBuilder()
                .setCustomId(`weave:section-${sectionName}`)
                .setLabel(`???`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
        }
    }

    if (section === WEAVE_SECTION.Tear) {
        let desc = `do you want to tear a bit of the universe?`;

        if (stats.total.tears <= 0) {
            desc = 
`to weave, you first need thread.
fortunately, the universe is ready to give you some.
unfortunately, it wants everything you have in return.
` + desc
        }

        desc += `\nthis will reset ALL of your progress (with the exception of Total stats), including pip, bp, pts, and all of their associated upgrades.`
        desc += `\nyou will gain **${formatNumber(getGainedThread(player), { options: player.formatSettings })} thread** for tearing the universe.`;
        
        if (stats.tear.eternities < getTearRequirement(stats.total.tears)) {
            desc = `the universe isn't quite ready to be torn again yet. you need ${stats.tear.eternities}/**${getTearRequirement(stats.total.tears)}** eternities to tear the universe again.`
        }
    
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### tear the universe?\n${desc}`));
        container.addActionRowComponents((actionRow) => actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`weave:reset`)
                .setLabel("time to tear!")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(stats.tear.eternities < getTearRequirement(stats.total.tears)),
            new ButtonBuilder()
                .setCustomId(`weave:breakdown`)
                .setLabel("thread breakdown")
                .setStyle(ButtonStyle.Secondary)
        ));
    }

    if (section === WEAVE_SECTION.Shop) {
        const stock = getShopStock(player.shopSeed);
        const ownedFabrics = player.ownedFabrics;
        const emptySlots = player.shopEmptySlots;

        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### fabric weaving\nyou have **${formatNumber(player.thread, { options: player.formatSettings })}** thread. the following fabrics are craftable right now:`));

        for (const fabricName of stock) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            let isBuyable = true;

            let desc = `**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**`;

            if (fabricUpgrade.isUnique() && ownedFabrics[fabricName] > 0) {
                desc += ` (unique, already owned)`;
                isBuyable = false;
            } else if (fabricUpgrade.isUnique()) {
                desc += ` (unique)`;
            }
            
            if (emptySlots.includes(stock.indexOf(fabricName)) && isBuyable) {
                isBuyable = false;
                desc += `\nalready bought!`;
            } else if (isBuyable) {
                desc += `\ncosts ${formatNumber(fabricUpgrade.getPrice(), { options: player.formatSettings })} thread`;

                if (ownedFabrics[fabricName] > 0) {
                    desc += `\nyou already own **${ownedFabrics[fabricName]}** of this fabric`;
                }
            }

            desc += `\n${fabricUpgrade.getDetails().description}`;
            
            const section = new SectionBuilder()
            section.addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(desc)
            )

            section.setButtonAccessory(new ButtonBuilder()
                .setCustomId(`weave:buy-${fabricName}`)
                .setLabel(`buy`)
                .setStyle(isBuyable ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(player.thread < fabricUpgrade.getPrice() || !isBuyable)
            )
            container.addSectionComponents(section);
        }
        
        const rerollButton = new ButtonBuilder()
            .setCustomId(`weave:shopReroll`)
            .setLabel(`reroll (${5 ** player.shopRerolls * 20} thread) (${player.shopRerolls}/3)`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(player.shopRerolls >= 3);
        if (player.shopRerolls >= 3) rerollButton.setLabel(`reroll (3/3)`)
        
        container.addSeparatorComponents((separator) => separator.setSpacing(SeparatorSpacingSize.Small))
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`fabrics in stock and reroll prices will be reset after tearing the universe.`))
            .setButtonAccessory(rerollButton)
        );
    }

    if (section === WEAVE_SECTION.Cloths) {
        let total = 0;
        for (const [, count] of Object.entries(player.ownedFabrics)) {
            total += count;
        }
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### fabrics\nyou have **${total}** total fabric${total === 1 ? "" : "s"}.`));

        for (const [fabricName, count] of Object.entries(player.ownedFabrics)) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            total += count;
            let nameDisplay = `${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}`;
            if (fabricUpgrade.isUnique()) {
                nameDisplay += ` (unique)`;
            }
            if (count > 1) {
                nameDisplay += ` (x${count})`;
            }

            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**${nameDisplay}**\n${fabricUpgrade.getDetails().description}`));
        }
    }

    if (section === WEAVE_SECTION.Cloak) {
        if (!player.equippedFabrics || Object.keys(player.equippedFabrics).length === 0) {
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### your cloak`));
        } else {
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### your cloak\nyour cloak has the following fabrics equipped:`));
        }
        
        for (const fabricName of Object.keys(player.equippedFabrics)) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            for (let i = 0; i < player.equippedFabrics[fabricName]; i++) {
                container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**\n${fabricUpgrade.getDetails().description}`));
            }
        }

        if (Object.keys(player.equippedFabrics).length === 0) {
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`you don't have a cloak yet! you can sew one now using the fabrics you own.`));
        } else if (player.cloakModificationsAllowed <= 0) {
            container.addSeparatorComponents((separator) => separator.setSpacing(SeparatorSpacingSize.Small))
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`you can't re-sew your cloak right now; tear the universe again to modify it more.`));
        } else {
            container.addSeparatorComponents((separator) => separator.setSpacing(SeparatorSpacingSize.Small))
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`you can re-sew your cloak **${player.cloakModificationsAllowed}** more time${player.cloakModificationsAllowed === 1 ? "" : "s"} before having to tear the universe.`));
        }

        container.addActionRowComponents((actionRow) => actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`weave:sew`)
                .setLabel(`${Object.values(player.equippedFabrics).length === 0 ? "" : "re-"}sew your cloak`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(player.cloakModificationsAllowed <= 0)
        ));
    }

    return { embeds: [], components: [container, categoryRow], flags: MessageFlags.IsComponentsV2 };
}

async function getSewEmbed(interaction, equippedFabrics, state = "normal") {
    const player = await database.Player.findByPk(interaction.user.id);

    if (!equippedFabrics) {
        equippedFabrics = player.equippedFabrics || {};
    }

    if (player.cloakModificationsAllowed <= 0) {
        return {
            embeds: [],
            components: [
                new TextDisplayBuilder()
                    .setContent(`you can't re-sew your cloak right now; tear the universe again to modify it more.`)
            ],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        };
    }

    const container = new ContainerBuilder()
        .setAccentColor(0x120830)

    const addMenu = new StringSelectMenuBuilder()
        .setCustomId(`weave:sewAdd`)
        .setPlaceholder("choose a fabric to add")
        .setMinValues(1)
        .setMaxValues(1);

    for (const [fabricName, count] of Object.entries(player.ownedFabrics)) {
        const availableCount = count - (equippedFabrics[fabricName] || 0);
        if (availableCount <= 0) continue;

        const fabricUpgrade = rawUpgrades[fabricName];
        if (!fabricUpgrade) continue;

        addMenu.addOptions([
            new StringSelectMenuOptionBuilder()
                .setLabel(`${fabricUpgrade.getDetails().name}${availableCount > 1 ? ` (x${availableCount})` : ""}`)
                .setValue(fabricName)
        ]);
    }
    if (addMenu.options.length === 0) {
        addMenu.addOptions([
            new StringSelectMenuOptionBuilder()
                .setLabel("all fabrics in use!")
                .setValue("none")
                .setDefault(true)
        ]);
        addMenu.setDisabled(true);
    }

    let totalEquipped = 0;
    let maxEquipped = 3;
    if (Object.keys(equippedFabrics).length === 0) {
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### sew your cloak\nyou don't have any fabrics selected. choose some below.`));
    } else {
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### sew your cloak`));
    }
    for (const [fabricName, count] of Object.entries(equippedFabrics)) {
        if (count <= 0) continue;

        const fabricUpgrade = rawUpgrades[fabricName];
        if (!fabricUpgrade) continue;

        const increasesMax = fabricUpgrade.getEffect(0, {}).special?.extraFabricSlots;
        if (increasesMax) {
            maxEquipped += increasesMax;
        }

        for (let i = 0; i < count; i++) {
            if (state === "final") {
                container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**\n${fabricUpgrade.getDetails().description}`));
            } else {
                container.addSectionComponents((section) => section
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**\n${fabricUpgrade.getDetails().description}`))
                    .setButtonAccessory(new ButtonBuilder()
                        .setCustomId(`weave:sewRemove-${fabricName}`)
                        .setLabel(`remove`)
                        .setStyle(ButtonStyle.Danger)
                    )
                );
            }   
        }
        totalEquipped += count;
    }

    const finishButton = new ButtonBuilder()
        .setCustomId(`weave:sewFinish`)
        .setLabel("finish sewing")
        .setStyle(ButtonStyle.Success)
    if (totalEquipped > maxEquipped) {
        finishButton.setDisabled(true).setStyle(ButtonStyle.Danger).setLabel(`${totalEquipped}/${maxEquipped} selected!`);
    }
    if (state === "confirm") {
        finishButton.setStyle(ButtonStyle.Danger).setLabel("are you sure?").setCustomId(`weave:sewFinishConfirm`);
    }
    if (state === "final") {
        finishButton.setDisabled(true).setStyle(ButtonStyle.Secondary).setLabel("cloak sewn!");
        addMenu.setDisabled(true);
    }

    // allow going slightly over for QoL but disable so embed doesn't get too long 
    if (totalEquipped >= maxEquipped + 2) {
        addMenu.setDisabled(true).setPlaceholder(`too many selected!`);
    }
    
    let finalDesc = ``;
    if (totalEquipped < maxEquipped) {
        finalDesc += `you can select up to **${maxEquipped - totalEquipped}** more fabric${maxEquipped - totalEquipped === 1 ? "" : "s"} for your cloak.`;
    }
    if (totalEquipped <= 0) {
        finishButton.setDisabled(true).setStyle(ButtonStyle.Secondary).setLabel("no fabrics selected!");
    }

    if (player.cloakModificationsAllowed > 1) {
        const remainingMods = state === "final" ? player.cloakModificationsAllowed : player.cloakModificationsAllowed - 1;
        finalDesc += `\nyou can re-sew your cloak ${remainingMods} more time${remainingMods === 1 ? "" : "s"} after this before having to tear the universe again.`;
    } else {
        finalDesc += `\nyou won't be able to re-sew your cloak without tearing the universe again!`;
    }
    
    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(finalDesc.trim()));

    const cancelButton = new ButtonBuilder()
        .setCustomId(`weave:sewCancel`)
        .setLabel("cancel")
        .setStyle(ButtonStyle.Secondary);
    if (state === "final") {
        cancelButton.setDisabled(true);
    }
    container.addActionRowComponents((actionRow) => actionRow.addComponents(addMenu));
    container.addActionRowComponents((actionRow) => actionRow.addComponents(finishButton, cancelButton));

    return {
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2
    }
}

function getEquippedFromSewMessage(message) {
    const equippedFabrics = {};
    const sections = [];

    for (const component of message.components[0].components) {
        if (component.accessory) {
            sections.push(component);
        }
    }

    for (const section of sections) {
        const fabricName = section.accessory.data.custom_id.split("-")[1];
        equippedFabrics[fabricName] = (equippedFabrics[fabricName] || 0) + 1;
    }

    return equippedFabrics;
}

function getNewSeed() {
    return Math.random().toString(36).substring(2, 15);
}

function getShopStock(seed) {
    const rng = new RandSeed(seed);
    const stock = [];
    const fabrics = Object.keys(upgrades.fabrics);

    if (seed === "TUTORIAL") {
        return ["goldlace", "elusive", "azure"]
    }
    
    while (stock.length < 3) {
        // very specific case where all registered fabrics are unique but there's not enough to fill stock
        if (fabrics.every(f => rawUpgrades[f].isUnique()) 
            && stock.every(f => rawUpgrades[f].isUnique()) 
            && stock.length === fabrics.length) { break; }

        const fabricIndex = Math.floor(rng.next() * fabrics.length);
        const fabric = fabrics[fabricIndex];

        if (stock.some(x => x === fabric)) {
            continue;
        }

        stock.push(fabric);
    }

    return stock;
}

function getGainedThread(player, simplify = true) {
    const gain = {};
    gain.base = 100;
    const stats = player.statsSync();
    const totalTears = stats.total.tears;
    
    if (player.score > 0) {
        gain.pts = Math.floor(Math.log10(player.score));
    }
    if (player.pip > 0) {
        gain.pip = Math.floor(Math.log10(player.pip) * 2);
    }
    if (stats.tear.eternities > getTearRequirement(totalTears)) {
        stats.tear.eternities = Math.min(player.eternities - getTearRequirement(totalTears), 15);
    }
    if (totalTears > 0) {
        gain.tears = Math.min(totalTears * 3, 30);
    }

    if (simplify) {
        // totals all gain sources
        return Object.values(gain).reduce((total, count) => {
            return total + count;
        })
    }

    return gain;
}

function getTearRequirement(tears) {
    return tears * 2 + 3;
}