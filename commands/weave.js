const formatNumber = require("../helpers/formatNumber");
const { rawUpgrades, upgrades } = require("../helpers/upgrades");
const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionContextType } = require("discord.js");
const database = require("../helpers/database");
const { FabricUpgradeTypes } = require("../helpers/commonEnums.js");
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

            if (player.eternities < getTearRequirement(player.tears)) {
                return await interaction.reply({
                    content: `you can't.... what?`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const gainedThread = getGainedThread(player);
            const gainedThreadDetailed = getGainedThread(player, false);

            player.tears++;
            player.totalTears++;
            player.thread += gainedThread;
            player.totalThread += gainedThread;
            player.cloakModificationsAllowed = 1;
            player.shopSeed = getNewSeed();
            player.shopEmptySlots = [];
            player.shopRerolls = 0;

            player.upgrades = {};
            player.score = 0;
            player.clicks = 0;
            player.glimmerClicks = 0;
            player.slumberClicks = 0;

            player.bp = 0;
            player.pip = 0;
            player.prestigeUpgrades = {};
            player.eternities = 0;

            await player.save();

            await awardBadge(interaction.user.id, 'interwoven', interaction.client);

            if (gainedThread - gainedThreadDetailed.tears <= 110) {
                await awardBadge(interaction.user.id, 'threadbare', interaction.client);
            }

            await interaction.update(await getEmbed(interaction, WEAVE_SECTION.Tear));
            return await interaction.followUp({
                content: `you tear the universe, and gained **${formatNumber(getGainedThread(player))}** thread (now ${formatNumber(player.thread)} total).`,
                flags: MessageFlags.Ephemeral
            });
        },
        breakdown: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const breakdown = getGainedThread(player, false);

            let desc = `you will gain ${formatNumber(getGainedThread(player))} thread for tearing the universe, given by the following:\n`;
            desc += `\n**base**: ${breakdown.base} (always given regardless)`;
            if (breakdown.pts) {
                desc += `\n**owned \`pts\`**: ${formatNumber(breakdown.pts)} (1 per every digit in your owned \`pts\`)`;
            }
            if (breakdown.pip) {
                desc += `\n**owned pip**: ${formatNumber(breakdown.pip)} (2 per every digit in your owned pip)`;
            }
            if (breakdown.eternities) {
                desc += `\n**eternities**: ${formatNumber(breakdown.eternities)} (1 per every eternity beyond the requirement, up to 15)`;
            }
            if (breakdown.tears) {
                desc += `\n**previous tears**: ${formatNumber(breakdown.tears)} (3 per every previous tear, up to 30)`;
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
        sewFinish: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            const response = await getSewEmbed(interaction, getEquippedFromSewMessage(interaction.message));
            const responseFinishButton = response.components[2].components[0];
            responseFinishButton.setCustomId(`weave:sewFinishConfirm`).setLabel("are you sure?").setStyle(ButtonStyle.Danger);
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

            const resewButton = new ButtonBuilder()
                .setCustomId(`weave:sew`)
                .setLabel("re-sew your cloak")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(player.cloakModificationsAllowed <= 0);
            
            await interaction.update({
                components: [ new ActionRowBuilder().addComponents(resewButton) ],
                embeds: [interaction.message.embeds[0]]
            })
            return await interaction.followUp({
                content: `your cloak has been sewn with the selected fabrics!`,
                flags: MessageFlags.Ephemeral
            });
        },
        sewCancel: async (interaction) => {
            await interaction.update({
                content: "the sewing has been cancelled.",
                components: [],
                embeds: []
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
        }
    },
    dropdowns: {
        buy: async (interaction) => {
            const fabricName = interaction.values[0];
            if (fabricName === "none") return await interaction.reply({ content: 'you already got everything!', flags: MessageFlags.Ephemeral });

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
                content: `you got **${fabricUpgrade.getDetails().name}** in exchange for **${formatNumber(fabricUpgrade.getPrice())}** thread!`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`weave:delete`)
                        .setLabel(msg[Math.floor(Math.random() * msg.length)])
                        .setStyle(ButtonStyle.Secondary)
                )]
            })
        },
        sewAdd: async (interaction) => {
            const fabricName = interaction.values[0];
            if (fabricName === "none") return await interaction.reply({ content: 'you already got everything!', flags: MessageFlags.Ephemeral });

            const equippedFabrics = getEquippedFromSewMessage(interaction.message);

            equippedFabrics[fabricName] = (equippedFabrics[fabricName] || 0) + 1;

            await interaction.update(await getSewEmbed(interaction, equippedFabrics));
        },
        sewRemove: async (interaction) => {
            const fabricName = interaction.values[0];
            if (fabricName === "none") return await interaction.reply({ content: 'you already got everything!', flags: MessageFlags.Ephemeral });

            const equippedFabrics = getEquippedFromSewMessage(interaction.message);

            equippedFabrics[fabricName]--;
            if (equippedFabrics[fabricName] <= 0) {
                delete equippedFabrics[fabricName];
            }

            await interaction.update(await getSewEmbed(interaction, equippedFabrics));
        }
    },
    getTearRequirement,
}

async function getEmbed(interaction, section = WEAVE_SECTION.Shop) {
    const [player, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });

    if (player.tears <= 0 && player.eternities < getTearRequirement(0)) {
        return { 
            content: "you'd love to try weaving... but regular old cloaks and quilts aren't going to do you any good in your pts gathering. maybe there's something more fundamental you're missing?", 
            flags: MessageFlags.Ephemeral 
        };
    }

    const availableSections = [WEAVE_SECTION.Tear]

    const embed = new EmbedBuilder()
        .setColor('#120830')

    const row = new ActionRowBuilder();
    let extraRows = [];
    
    if (player.tears > 0) {
        availableSections.push(WEAVE_SECTION.Shop);
    } else {
        section = WEAVE_SECTION.Tear; // force this section with no previous tears, since they'll need to do this first
    }
    if (Object.keys(player.ownedFabrics).length > 0) {
        availableSections.push(WEAVE_SECTION.Cloths, WEAVE_SECTION.Cloak);
    }

    for (const sectionName of availableSections) {
        row.addComponents(new ButtonBuilder()
            .setCustomId(`weave:section-${sectionName}`)
            .setLabel(sectionName)
            .setStyle(section === sectionName ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    }

    if (section === WEAVE_SECTION.Tear) {
        let desc = `do you want to tear a bit of the universe?`;

        if (player.tears <= 0) {
            desc = 
`to weave, you first need thread.
fortunately, the universe is ready to give you some.
unfortunately, it wants everything you have in return.
` + desc
        }

        desc += `\nthis will reset ALL of your progress (with the exception of Total stats), including pip, bp, pts, and all of their associated upgrades.`
        desc += `\nyou will gain **${formatNumber(getGainedThread(player))} thread** for tearing the universe.`;
        
        if (player.eternities < getTearRequirement(player.tears)) {
            desc = `the universe isn't quite ready to be torn again yet. you need ${player.eternities}/**${getTearRequirement(player.tears)}** eternities to tear the universe again.`
        }
    
        embed.setTitle("tear the universe?")
        embed.setDescription(desc);
        extraRows.push(new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId(`weave:reset`)
                .setLabel("time to tear!")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(player.eternities < getTearRequirement(player.tears)),
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
        const select = new StringSelectMenuBuilder()
            .setCustomId(`weave:buy`)
            .setPlaceholder("choose a fabric")
            .setMinValues(1)
            .setMaxValues(1)

        let desc = `you have **${formatNumber(player.thread)}** thread. the following fabrics are craftable right now:`;
        embed.setFooter({ text: `fabrics in stock and reroll prices will be reset after tearing the universe.` })
        embed.setTitle("fabric weaving")

        for (const fabricName of stock) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            let isBuyable = true;

            desc += `\n\n**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**`;

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
                desc += `\ncosts ${formatNumber(fabricUpgrade.getPrice())} thread`;

                if (ownedFabrics[fabricName] > 0) {
                    desc += `\nyou already own **${ownedFabrics[fabricName]}** of this fabric`;
                }
            }

            desc += `\n${fabricUpgrade.getDetails().description}`;

            if (isBuyable) {
                select.addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel(fabricUpgrade.getDetails().name)
                        .setValue(fabricName)
                ])
            }
        }

        if (select.options.length === 0) {
            select.addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("all sold out!")
                    .setValue("none")
                    .setDefault(true)
            ])
            select.setDisabled(true);
        }

        embed.setDescription(desc);
        extraRows.push(new ActionRowBuilder().addComponents(select));
        
        const rerollButton = new ButtonBuilder()
            .setCustomId(`weave:shopReroll`)
            .setLabel(`reroll (${5 ** player.shopRerolls * 20} thread) (${player.shopRerolls}/3)`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(player.shopRerolls >= 3);
        if (player.shopRerolls >= 3) rerollButton.setLabel(`reroll (3/3)`)
        
        extraRows.push(new ActionRowBuilder().addComponents(rerollButton));
    }

    if (section === WEAVE_SECTION.Cloths) {
        embed.setTitle("fabrics")
        let desc = "";
        
        let total = 0;
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

            desc += 
`

**${nameDisplay}**
${fabricUpgrade.getDetails().description}`;
        }

        embed.setDescription(`you have **${total}** total fabric${total === 1 ? "" : "s"}.${desc}`);
    }

    if (section === WEAVE_SECTION.Cloak) {
        embed.setTitle("your cloak")
        
        let desc = `your cloak has the following fabrics equipped:`;
        for (const fabricName of Object.keys(player.equippedFabrics)) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            desc += `\n\n**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**\n${fabricUpgrade.getDetails().description}`.repeat(player.equippedFabrics[fabricName] || 1);
        }

        if (player.cloakModificationsAllowed <= 0) {
            desc += `\n\nyou can't re-sew your cloak right now; tear the universe again to modify it more.`;
        } else {
            desc += `\n\nyou can re-sew your cloak **${player.cloakModificationsAllowed}** more time${player.cloakModificationsAllowed === 1 ? "" : "s"} before having to tear the universe.`;
        }


        if (Object.keys(player.equippedFabrics).length === 0) {
            desc = `you don't have a cloak yet! you can sew one now using the fabrics you own.`
        }

        embed.setDescription(desc);
        extraRows.push(new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId(`weave:sew`)
            .setLabel(`${Object.values(player.equippedFabrics).length === 0 ? "" : "re-"}sew your cloak`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(player.cloakModificationsAllowed <= 0)
        ));
    }

    const components = [];
    components.push(row);
    if (extraRows.length > 0) {
        for (const extraRow of extraRows) {
            components.push(extraRow);
        }
    }

    return { embeds: [embed], components: components };
}

async function getSewEmbed(interaction, equippedFabrics) {
    const player = await database.Player.findByPk(interaction.user.id);

    if (!equippedFabrics) {
        equippedFabrics = player.equippedFabrics || {};
    }

    if (player.cloakModificationsAllowed <= 0) {
        return {
            content: `you can't re-sew your cloak right now; tear the universe again to modify it more.`,
            flags: MessageFlags.Ephemeral
        };
    }

    const sewEmbed = new EmbedBuilder()
        .setColor('#120830')

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
    
    const removeMenu = new StringSelectMenuBuilder()
        .setCustomId(`weave:sewRemove`)
        .setPlaceholder("choose a fabric to remove")
        .setMinValues(1)
        .setMaxValues(1);

    let totalEquipped = 0;
    let maxEquipped = 3;
    let desc = `the fabrics you selected have the following effects:`;
    for (const [fabricName, count] of Object.entries(equippedFabrics)) {
        if (count <= 0) continue;

        const fabricUpgrade = rawUpgrades[fabricName];
        if (!fabricUpgrade) continue;

        const increasesMax = fabricUpgrade.getEffect(0, {}).special?.extraFabricSlots;
        if (increasesMax) {
            maxEquipped += increasesMax;
        }

        desc += `\n\n**${fabricUpgrade.getDetails().emoji} ${fabricUpgrade.getDetails().name}**\n${fabricUpgrade.getDetails().description}`.repeat(count);
        totalEquipped += count;
        removeMenu.addOptions([
            new StringSelectMenuOptionBuilder()
                .setLabel(`${fabricUpgrade.getDetails().name}${count > 1 ? ` (x${count})` : ""}`)
                .setValue(fabricName)
        ]);
    }
    if (removeMenu.options.length === 0) {
        removeMenu.addOptions([
            new StringSelectMenuOptionBuilder()
                .setLabel("no fabrics in use!")
                .setValue("none")
                .setDefault(true)
        ]);
        removeMenu.setDisabled(true);
        desc = `you don't have any fabrics selected. choose some below.`
    }

    const finishButton = new ButtonBuilder()
        .setCustomId(`weave:sewFinish`)
        .setLabel("finish sewing")
        .setStyle(ButtonStyle.Success)
    if (totalEquipped > maxEquipped) {
        finishButton.setDisabled(true).setStyle(ButtonStyle.Danger).setLabel(`${totalEquipped}/${maxEquipped} selected!`);
    }
    // allow going slightly over for QoL but disable so embed doesn't get too long 
    if (totalEquipped >= maxEquipped + 2) {
        addMenu.setDisabled(true).setPlaceholder(`too many selected!`);
    }
    
    if (totalEquipped < maxEquipped) {
        desc += `\n\nyou can select up to **${maxEquipped - totalEquipped}** more fabric${maxEquipped - totalEquipped === 1 ? "" : "s"}.`
    }
    if (totalEquipped <= 0) {
        finishButton.setDisabled(true).setStyle(ButtonStyle.Secondary).setLabel("no fabrics selected!");
    }

    sewEmbed.setTitle("sew your cloak")
        .setDescription(desc)

    if (player.cloakModificationsAllowed > 1) {
        sewEmbed.setFooter({ text: `you can re-sew your cloak ${player.cloakModificationsAllowed - 1} more time${player.cloakModificationsAllowed - 1 === 1 ? "" : "s"} after this before having to tear the universe again.` });
    } else {
        sewEmbed.setFooter({ text: `you won't be able to re-sew your cloak without tearing the universe again!` });
    }

    const cancelButton = new ButtonBuilder()
        .setCustomId(`weave:sewCancel`)
        .setLabel("cancel")
        .setStyle(ButtonStyle.Secondary);

    return {
        embeds: [sewEmbed],
        components: [
            new ActionRowBuilder().addComponents(addMenu),
            new ActionRowBuilder().addComponents(removeMenu),
            new ActionRowBuilder().addComponents(finishButton, cancelButton)
        ]
    }
}

function getEquippedFromSewMessage(message) {
    let equippedFabrics = {};
    let removeComponent;

    for (const row of message.components) {
        if (row.components.some(c => c.customId === 'weave:sewRemove')) {
            removeComponent = row.components.find(c => c.customId === 'weave:sewRemove');
            break;
        }
    }
    if (!removeComponent) return equippedFabrics;

    for (const option of removeComponent.options) {
        if (option.value === 'none') break;
        const fabricName = option.value;
        // regex looks gross but just extracts the count from (xNUMBER)
        const count = parseInt(option.label.match(/\(x(\d+)\)/)?.[1] || 1); 

        equippedFabrics[fabricName] = count;
    }

    return equippedFabrics;
}

function getNewSeed() {
    return Math.random().toString(36).substring(2, 15);
}

function getShopStock(seed) {
    const rng = new RandSeed(seed);
    const stock = [];
    const fabrics = Object.keys(upgrades['fabrics']);

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
    let gain = {};
    gain['base'] = 100;
    
    if (player.score > 0) {
        gain['pts'] = Math.floor(Math.log10(player.score));
    }
    if (player.pip > 0) {
        gain['pip'] = Math.floor(Math.log10(player.pip) * 2);
    }
    if (player.eternities > getTearRequirement(player.tears)) {
        gain['eternities'] = Math.min(player.eternities - getTearRequirement(player.tears), 15);
    }
    if (player.tears > 0) {
        gain['tears'] = Math.min(player.tears * 3, 30);
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