const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder } = require('discord.js');
const database = require('./../helpers/database.js');
const sequelize = require('sequelize');
const getLatestVersion = require('./../helpers/versions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('version')
        .setDescription('view the bot\'s version')
        .setDescription('view a changelog for a specific version')
        .addStringOption(option =>
            option.setName('version')
                .setDescription('the version to view')
                .setRequired(false)
                .setAutocomplete(true)
        )
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        if (process.env.BETA_TEST === 'true') {
            return await interaction.reply({ content: "versioning isn't available in beta!", flags: MessageFlags.Ephemeral });
        }

        const version = interaction.options.getString('version') || 'latest';
        if (version === 'none') {
            return await interaction.reply({ content: 'no, that\'s not a version, what are you doing?', flags: MessageFlags.Ephemeral });
        }
        await interaction.reply(await getVersionMessage(version));
        return;
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const versions = await database.Version.findAll({
            attributes: ['verNum'],
            order: [['releasedAt', 'DESC']],
        });

        if (!versions || versions.length === 0) {
            await interaction.respond([]);
            return;
        }

        let choices = versions.map(v => v.verNum).filter(v => v.includes(focusedValue));
        if (choices.length > 25) {
            choices = choices.slice(0, 25);
        }

        if (!versions || versions.length === 0) {
            await interaction.respond([]);
        }

        await interaction.respond(choices.map(choice => ({ name: choice, value: choice })));
    },
    buttons: {
        ver: async (interaction, version) => {
            await interaction.update(await getVersionMessage(version));
        }
    },
    modals: {
        announce: async (interaction) => {
            const description = interaction.fields.getTextInputValue('description');
            const type = interaction.fields.getStringSelectValues('importance')[0];

            const currentVerInfo = getVersionInfo(await getLatestVersion());

            const newVersion = await database.Version.create({
                verNum: setVersionString({
                    major: currentVerInfo.major + (type === 'major' ? 1 : 0),
                    minor: (type === 'major' ? 0 : currentVerInfo.minor + (type === 'minor' ? 1 : 0)),
                    patch: (type === 'major' || type === 'minor' ? 0 : currentVerInfo.patch + (type === 'patch' ? 1 : 0)),
                    hotfix: (type === 'hotfix' ? (currentVerInfo.hotfix !== null ? currentVerInfo.hotfix + 1 : 1) : null),
                }),
                importance: type,
                description: description,
            })

            const allowedSettings = ["always"];
            if (type === 'major') {
                allowedSettings.push("major only", "minor and major only", "everything but hotfixes");
            }
            if (type === 'minor') {
                allowedSettings.push("minor and major only", "everything but hotfixes");
            }
            if (type === 'patch') {
                allowedSettings.push("everything but hotfixes");
            }

            const usersToNotify = await database.Player.findAll({
                where: {
                    settings: {
                        updateNotification: {
                            [sequelize.Op.in]: allowedSettings,
                        }
                    }
                },
                attributes: ['userId'],
            });

            await interaction.reply({ content: `announcing \`v${newVersion.verNum}\` to ${usersToNotify.length} users...`, flags: MessageFlags.Ephemeral });
            const alerts = { success: 0, noUser: 0, dmFailed: 0 };

            await Promise.all(usersToNotify.map(async (user) => {
                const userToDm = await interaction.client.users.fetch(user.userId).catch(() => null);
                if (!userToDm) {
                    alerts.noUser++;
                    return;
                }

                try {
                    await userToDm.send({
                        content: `a new ${type === 'minor' || type === 'major' ? `${type} update` : type} has been released! \`v${newVersion.verNum}\``,
                        embeds: [getVersionEmbed(newVersion)],
                    });
                    alerts.success++;
                } catch (error) {
                    console.log(`[WARN] failed to DM user ${user.userId} about new version:`, error);
                    alerts.dmFailed++;
                }
            }));

            await getLatestVersion(true); // update cached ver because there's a new one

            let reply = `success! announced \`v${newVersion.verNum}\` to ${alerts.success} users`;
            if (alerts.noUser > 0) {
                reply += `\n${alerts.noUser} users could not be found`;
            }
            if (alerts.dmFailed > 0) {
                reply += `\n${alerts.dmFailed} users could not be DMed`;
            }
            await interaction.editReply({ content: reply });
        }
    },
}

function getVersionEmbed(versionData) {
    return new EmbedBuilder()
        .setTitle(`v${versionData.verNum}`)
        .setDescription(versionData.description)
        .setTimestamp(versionData.releasedAt)
        .setColor(versionData.importance === 'major' ? '#2c2cde' : versionData.importance === 'minor' ? '#2c76de' : versionData.importance === 'patch' ? '#5aa4b0' : '#52827c');
}

async function getVersionMessage(version) {
    let versionData = await database.Version.findOne({
        where: {
            verNum: version,
        }
    });
    if (version === 'latest') {
        versionData = await database.Version.findOne({ order: [['releasedAt', 'DESC']] });
    }

    if (!versionData) {
        return { content: `no changelog found for v\`${version}\` :(`, flags: MessageFlags.Ephemeral };
    }

    const embed = getVersionEmbed(versionData);
    const row = new ActionRowBuilder()

    if (versionData.dbId > 1) {
        const lastVer = await database.Version.findOne({
            where: {
                dbId: versionData.dbId - 1,
            }
        });
        const prevVerButton = new ButtonBuilder()
            .setCustomId(`version:ver-${lastVer.verNum}`)
            .setLabel(`<- ${lastVer.verNum}`)
            .setStyle(ButtonStyle.Secondary);
        row.addComponents(prevVerButton);
    } else {
        const prevVerButton = new ButtonBuilder()
            .setCustomId('version:ver-none')
            .setLabel('<- x.x.x')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        row.addComponents(prevVerButton);
    }

    if (versionData.dbId < await database.Version.count()) {
        const nextVer = await database.Version.findOne({
            where: {
                dbId: versionData.dbId + 1,
            }
        });
        const nextVerButton = new ButtonBuilder()
            .setCustomId(`version:ver-${nextVer.verNum}`)
            .setLabel(`${nextVer.verNum} ->`)
            .setStyle(ButtonStyle.Secondary);
        row.addComponents(nextVerButton);
    } else {
        const nextVerButton = new ButtonBuilder()
            .setCustomId('version:ver-none')
            .setLabel('x.x.x ->')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        row.addComponents(nextVerButton);
    }

    return { embeds: [embed], components: [row] };
}

function getVersionInfo(versionString) {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)(h(\d+))?$/;
    const match = versionString.match(versionRegex);

    if (!match) {
        throw new Error('Invalid version format');
    }

    return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]),
        hotfix: match[4] ? parseInt(match[5]) : null,
    };
}

function setVersionString(versionInfo) {
    let versionString = `${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`;
    if (versionInfo.hotfix !== null) {
        versionString += `h${versionInfo.hotfix}`;
    }
    return versionString;
}