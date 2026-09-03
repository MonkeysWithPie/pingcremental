const { SlashCommandBuilder, MessageFlags, InteractionContextType, TextInputStyle, LabelBuilder, StringSelectMenuBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputBuilder } = require("discord.js");
const database = require("../helpers/database");
const util = require("node:util");
const { cacheCommandIds, getEmbeddedCommand } = require("../helpers/embedCommand");
const { initEmojis } = require("../helpers/emojis");
const pingMessages = require("../helpers/pingMessage");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { getBadgeByName } = require("../helpers/badgeUtils");

const ownerId = process.env.OWNER_ID

const userDirectories = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('console')
        .setDescription('run console commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('the command to run')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const fullCommand = interaction.options.getString('command');
        const command = fullCommand.split(" ")[0];
        const args = fullCommand.split(" ").slice(1) || [];
        const [interactionPlayer] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });
        const userCommandsUnlocked = interactionPlayer.unlockedCommands;

        let output;
        if (commands[command]) {
            output = await commands[command](interaction, args);

            if (!userCommandsUnlocked.includes(command)) {
                userCommandsUnlocked.push(command);
                interactionPlayer.unlockedCommands = userCommandsUnlocked;
                await interactionPlayer.save();
            }
        } else {
            output = `command not found: ${command}`;
        }

        if (!output) {
            return await interaction.reply({ content: `\`# ${fullCommand}\``, flags: MessageFlags.Ephemeral });
        }
        if (output === true) {
            return;
        }

        return await interaction.reply({ content: `\`# ${fullCommand}\`\n\`\`\`txt\n${output}\`\`\``, flags: MessageFlags.Ephemeral });
    },
    registerFiles
}



const files = {};

function registerFiles() {
    let data;
    try {
        data = readFileSync(path.join(__dirname, "../data/console.txt"))
    } catch {
        console.warn("no console files found!");
        return;
    }
    const lines = data.toString().split("\n")

    let currentDir = { name: '', files: [], type: 'directory', locked: false };
    const rootDir = currentDir;
    let tabs = 0;

    for (const line of lines) {
        if (line.trim().startsWith("//") || line.trim() === "") continue;

        const splitLine = line.split(":");
        const fileName = splitLine[0].trim();
        const fileData = splitLine[1]?.split("//")[0].trim().split(" ");
        const fileTabs = splitLine[0].replace(fileName, "").length / 4;

        while (fileTabs < tabs) {
            if (!currentDir.parent) throw new Error(`${currentDir.name} has no parent (this shouldn't be possible)`);

            tabs--;
            currentDir = currentDir.parent;
        }

        if (fileData.indexOf('folder') !== -1) {
            const newDir = { name: fileName, files: [], type: 'directory', locked: fileData.indexOf('locked') !== -1 };
            tabs++;
            newDir.parent = currentDir;

            if (!currentDir.children) currentDir.children = [];
            currentDir.children.push(newDir);
            currentDir = newDir;
        } else if (fileData.indexOf('file') !== -1) {
            const contentDirIndex = fileData.indexOf('file') + 1;

            if (contentDirIndex === 0) throw new Error(`${fileName} has no content directory specified`);
            const contentDir = path.join(`${__dirname}`, `../data/console/${fileData[contentDirIndex]}`);

            const fileType = fileData.indexOf('text') !== -1 ? 'text' : 'attachment';

            const keyIndex = fileData.indexOf('key');
            let key = undefined;
            if (keyIndex !== -1) {
                key = "";
                let i = keyIndex + 1;

                while (i < fileData.length) {
                    key += fileData[i].replace("\"", "") + " ";
                    if (fileData[i].endsWith('"')) break;
                    i++;
                }

                key = key.trim();
            }

            const newFile = { name: fileName, fileType: fileType, contentPath: contentDir, type: 'file', decryptKey: key, locked: fileData.indexOf(' locked ') !== -1 };

            currentDir.files.push(newFile);
        }
    }

    function traverse(dir, currentPath) {
        const path = currentPath + dir.name + "/";
        files[path] = dir;

        if (dir.children) {
            for (const child of dir.children) {
                traverse(child, path);
            }
        }
    }

    traverse(rootDir, "");
}

function getConsoleDir(path) {
    return files[path] || null;
}

function getConsoleFileData(file) {
    if (file.fileType === 'text') {
        try {
            return readFileSync(path.join(file.contentPath)).toString();
        } catch (err) {
            if (err instanceof Error && err.message.includes('ENOENT')) {
                console.error(`file ${file.name} is missing (path: ${file.contentPath})`);
                return `internals: file ${file.name} is missing`
            }

            console.error(err)
            return `internal: error reading file ${file.name}`;
        }
    }

    return path.join(file.contentPath);
}

function getUserDirectory(userId) {
    if (!userDirectories[userId]) {
        userDirectories[userId] = "/home/guest/";
    }
    return userDirectories[userId];
}



const ownerRequiredCommand = (command) => {
    return (interaction, args) => {
        if (args[0] === "--help") {
            return "a command for super secret things that only the owner can do";
        }
        if (interaction.user.id !== ownerId)
            return "not for you!";

        return command(interaction, args);
    }
}
const filesRequiredCommand = (command) => {
    return (interaction, args) => {
        if (Object.keys(files).length === 0) {
            return "you're in a strange computer with no files! how strange.";
        }

        return command(interaction, args);
    }
}


const commands = {
    "restart": ownerRequiredCommand(async (interaction) => {
        await interaction.reply({ content: '`# restart`\n```OK!```', flags: MessageFlags.Ephemeral });
        process.exit(0);
    }),
    "pull": ownerRequiredCommand(async () => {
        const execAsync = util.promisify(require("child_process").exec);
        const { error, stdout, stderr } = await execAsync("git pull");
        if (error) {
            return `FAIL!\n${error}`;
        }

        let output = "OK!";
        output += stdout ? `\n${stdout}` : "";
        output += stderr ? `\nstderr: ${stderr}` : "";
        return output;
    }),
    "run": ownerRequiredCommand(async (interaction, args) => {
        const code = args.join(" ");
        try {
            let result = await eval(`async (params) => { ${code} }`)({ database, interaction });
            if (result instanceof Promise) {
                result = await result;
            }
            if (result === undefined) {
                return "OK!";
            }

            if (result instanceof Object) {
                result = JSON.stringify(result, null, 2);
            } else if (typeof result === "string") {
                result = result.replace(/`/g, "\\`");
            }

            return `OK!\nresult: ${result}`;
        }
        catch (error) {
            return `FAIL!\n${error}`;
        }
    }),
    "recache": ownerRequiredCommand(async (interaction) => {
        await initEmojis(interaction.client);
        await cacheCommandIds();
        return "OK!";
    }),
    "data": ownerRequiredCommand(async (interaction, args) => {
        if (!args[0] || !args[1]) {
            return "FAIL!\nUsage: data <user> <key> [layer|\"profile\"] [value]";
        }
        const userId = args[0].replace(/[<@!>]/g, "");
        const key = args[1];
        const layer = args[2] || "profile";
        const value = args.slice(3).join(" ");

        let obj;
        const player = await database.Player.findByPk(userId);
        if (!player) {
            return `FAIL!\nNo data found for ${userId}`;
        }

        if (layer === "profile") {
            obj = player;
        } else {
            obj = (await player.stats())[layer];
        }

        if (value === "" || value === undefined) {
            let dataValue = obj[key];
            if (typeof dataValue === "object") {
                dataValue = JSON.stringify(dataValue, null, 2);
            }
            return `OK!\n${userId}'s ${layer} ${key}: ${dataValue}`;
        }

        if (obj[key] === undefined) {
            return `FAIL!\nKey ${key} doesn't exist on ${userId}'s ${layer}`;
        }

        obj[key] = value;
        await obj.save();
        return `OK!\nSet ${key} to ${value} for ${userId} in layer ${layer}`;
    }),
    "update": ownerRequiredCommand(async (interaction) => {
        if (process.env.BETA_TEST === 'true') {
            return "versioning isn't available in beta!";
        }

        const descriptionLabel = new LabelBuilder()
            .setLabel('description of the changes')
            .setTextInputComponent(
                new TextInputBuilder()
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setCustomId('description')
            );

        const importanceSelect = new StringSelectMenuBuilder()
            .setCustomId('importance')
            .setPlaceholder('select the importance of the update')
            .setMaxValues(1)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Major')
                    .setValue('major')
                    .setDescription('new prestige layers or other major features'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Minor')
                    .setValue('minor')
                    .setDescription('sizable changes like new upgrades or small reworks'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Patch')
                    .setValue('patch')
                    .setDescription('small changes like balancing or bug fixes'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Hotfix')
                    .setValue('hotfix')
                    .setDescription('bug fixes')
            );

        const modal = new ModalBuilder()
            .setCustomId(`version:announce`)
            .setTitle(`announcing a new version...`)
            .addLabelComponents(
                descriptionLabel,
                new LabelBuilder()
                    .setLabel('importance level')
                    .setStringSelectMenuComponent(importanceSelect)
            );

        await interaction.showModal(modal);
    }),
    "award": ownerRequiredCommand(async (interaction, args) => {
        function badgeDisplay(badge) {
            return `${badge.emoji} ${badge.name}`
        }

        const userId = args[0].replace(/[<@!>]/g, "");
        const badgeName = args.slice(1).join(" ");

        const player = await database.Player.findByPk(userId);
        if (!player) {
            return `couldn't find a player with the id ${userId}`;
        }
        const badge = getBadgeByName(badgeName);
        let dmMessage;
        let playerDisplayedBadges = player.displayedBadges;
        let playerBadges = player.badges; // because sequelize doesn't like it when you try to modify the array directly

        if (playerBadges.includes(badge.name)) {
            playerBadges = playerBadges.filter(bId => bId !== badge.name);
            playerDisplayedBadges = playerDisplayedBadges.filter(bId => bId !== badge.name);

            dmMessage = `**bad news...**\n\nthe badge ${badgeDisplay(badge)} was manually removed. \nif you think this was a mistake, stay tuned; your badge will likely be returned soon.`;
        } else {
            playerBadges.push(badge.name);

            dmMessage = `**good news!!**\n\nyou have been manually awarded the badge ${badgeDisplay(badge)}! be sure to show it off with ${getEmbeddedCommand('badges showcase')}.`;
        }

        player.badges = playerBadges;
        player.displayedBadges = playerDisplayedBadges;
        await player.save();

        const dmablePlayer = await interaction.client.users.resolve(userId);
        if (dmablePlayer) dmablePlayer.send(dmMessage).catch(err => {
            console.warn(`couldn't DM ${userId} about badge award: `, err);
        });

        return `successfully ${player.badges.includes(badge.name) ? 'awarded' : 'removed'} the badge ${badgeDisplay(badge)} to ${await player.getUserDisplay(interaction.client, database)}`;
    }),

    "meow": (interaction, args) => {
        if (args[0] === "--help") {
            return "meow!"
        }

        let count = parseInt(args[0]) || 1;
        let suff = "";
        if (count > 100) {
            count = 100;
            suff = "me...";
        }
        if (count === 5) return `${"meow".repeat(count)} :wyphsmall:`;
        return `${"meow".repeat(count)}${suff}`;
    },
    "meowmeowmeowmeowmeow": () => {
        return ":wyphsmall:";
    },
    "echo": (interaction, args) => {
        if (args[0] === "--help") {
            return "echoes back what you say"
        }
        return "did it really say this?:\n" + args.join(" ");
    },
    "ping": async (interaction, args) => {
        if (args[0] === "--help") {
            return "measures the bot's actual latency";
        }

        const now = Date.now();
        const command = `\`# ping${args[0] ? " " + args.join(" ") : ""}\``
        await interaction.reply({ content: `${command}\n\`\`\`measuring latency...\`\`\``, flags: MessageFlags.Ephemeral });
        const finish = Date.now();

        const pingmessage = pingMessages(finish - now, { user: interaction.user, fromConsole: true })
        await interaction.editReply(`${command}\n\`\`\`${pingmessage}\`\`\``)

        return true;
    },

    "help": async (interaction, args) => {
        if (args[0] === "--help") {
            return "you'd never believe what it does..."
        }

        const [playerProfile,] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });
        const unlockedCommands = playerProfile.unlockedCommands || [];
        let resp = "Available commands:\n\n";

        for (const command of unlockedCommands) {
            if (!commands[command]) {
                console.warn(`player ${interaction.user.id} has unlocked command ${command} but it doesn't exist`);
            }

            resp += `- ${command}   `;
            const commandDescription = await commands[command](interaction, ["--help"]);
            resp += commandDescription ? `: ${commandDescription}` : "(i'm not sure!)";
        }

        return resp;
    },

    // hi avid pingcremental fans! might attach a badge to this one later, so remember this
    "datamine": (interaction, args) => {
        if (args[0] === "--help") {
            return "who knows!"
        }

        if (args[0] === "aIdjbNE") {
            return "wow, you did it!"
        }

        return "that's not it!"
    },

    "ls": filesRequiredCommand((interaction, args) => {
        if (args[0] === "--help") {
            return "lists the files in the current directory";
        }

        const currentDirString = getUserDirectory(interaction.user.id);
        const workingDir = getConsoleDir(currentDirString);
        let output = `${currentDirString} CONTENTS`;

        for (const file of workingDir.files) {
            if (file.locked) {
                output += `\nX ${file.name}`;
            }
            else if (file.decryptKey) {
                output += `\n? ${file.name}`;
            } else {
                output += `\n- ${file.name}`;
            }
        }
        for (const child of workingDir.children || []) {
            if (child.locked) {
                output += `\nX ${child.name}/`;
            } else {
                output += `\n- ${child.name}/`;
            }
        }

        if ((workingDir.children?.length || 0) + workingDir.files.length === 0) {
            output += "\n<empty>";
        }

        return output;
    }),
    "pwd": filesRequiredCommand((interaction, args) => {
        if (args[0] === "--help") {
            return "prints the current working directory";
        }
        return getUserDirectory(interaction.user.id);
    }),
    "cd": filesRequiredCommand((interaction, args) => {
        if (args[0] === "--help") {
            return "changes the current working directory";
        }

        const dirName = args.join(' ');
        const dirNameSplit = dirName.split('/').filter(d => d.length > 0);

        const currentDirString = getUserDirectory(interaction.user.id);
        const workingDir = getConsoleDir(currentDirString);
        let newDir = workingDir;
        let newDirString = currentDirString;

        for (const part of dirNameSplit) {
            if (part === "..") {
                if (!newDir.parent) {
                    continue;
                }

                newDirString = newDirString.split('/').slice(0, -2).join('/') + "/";
                newDir = newDir.parent;
                continue;
            }

            const foundDir = (newDir.children || []).find(d => d.name === part);
            if (!foundDir) {
                return "directory not found: " + part;
            }
            if (foundDir.locked) {
                return "access is denied: " + foundDir.name;
            }

            newDir = foundDir;
            newDirString += foundDir.name + "/";
        }

        userDirectories[interaction.user.id] = newDirString;
        return;
    }),
    "cat": filesRequiredCommand(async (interaction, args) => {
        if (args[0] === "--help") {
            return "displays the contents of a file, optionally decrypting it with a key";
        }

        const fileName = args[0];
        if (!fileName) {
            return "usage: cat <file> [--key <key>]";
        }

        const currentDirString = getUserDirectory(interaction.user.id);
        const workingDir = getConsoleDir(currentDirString);
        const file = workingDir.files.find(f => f.name === fileName);

        if (!file) {
            return "file not found";
        }
        if (file.locked) {
            return "access is denied";
        }

        let key;
        if (args.indexOf('--key') !== -1) {
            const keyIndex = args.indexOf('--key') + 1;
            if (keyIndex >= args.length) {
                return "usage: cat <file> [--key <key>]";
            }

            const currentDirString = getUserDirectory(interaction.user.id);
            const workingDir = getConsoleDir(currentDirString);
            const file = workingDir.files.find(f => f.name === fileName);

            if (!file) {
                return "file not found: " + fileName;
            }
            if (file.locked) {
                return "file is locked: " + fileName;
            }

            key = "";
            if (args[keyIndex].startsWith('"')) {
                let i = keyIndex;
                while (i < args.length) {
                    key += args[i] + " ";
                    if (args[i].endsWith('"')) break;
                    i++;
                }
                key = key.trim().replace(/^"|"$/g, '');
            } else {
                key = args[keyIndex];
            }
        }
        const fileContents = getConsoleFileData(file);

        if (key !== file.decryptKey && file.decryptKey) {
            if (key === undefined) {
                key = "viaCat";
            }
            let output = "";
            const charactersPerSlice = 64;

            // the key is wrong, so we create a jumbled mess based on the file and the key provided
            // (this also ensures the same key gives the same output)
            for (let i = 0; i < Math.ceil(fileContents.length / charactersPerSlice); i++) {
                const sliced = fileContents.slice(i * charactersPerSlice, (i + 1) * charactersPerSlice);
                const cryptedBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sliced + key))
                const hashArray = Array.from(new Uint8Array(cryptedBuffer));
                const hashText = hashArray.map(b => b.toString(36)).join('');
                output += hashText;
            }

            // give the user a nudge in the right direction; better not to send them on wild goose chases
            if (key === "viaCat") {
                output += "\n\n!! this file is encrypted, use the --key option to decrypt it";
            } else {
                output += "\n\n!! the key provided doesn't match internal signatures";
            }
            return output;
        }

        let out = fileContents;
        if (!file.decryptKey && key) {
            out += "\n\n! this file is not encrypted, the --key option is not needed";
        }

        return out;
    })
}