const { SlashCommandBuilder, MessageFlags, InteractionContextType } = require("discord.js");
const database = require("../helpers/database");
const util = require("node:util");
const { cacheCommandIds } = require("../helpers/embedCommand");
const { initEmojis } = require("../helpers/emojis");

const ownerId = process.env.OWNER_ID

const ownerRequiredCommand = (command) => {
    return (interaction, args) => {
        if (interaction.user.id !== ownerId) 
            return "not for you!";

        return command(interaction, args);
    }
}

const execAsync = util.promisify(require("child_process").exec);

const commands = {
    "restart": ownerRequiredCommand(async (interaction) => {
        await interaction.reply({ content: '`# restart`\n```OK!```', flags: MessageFlags.Ephemeral });
        process.exit(0);
    }),
    "pull": ownerRequiredCommand(async () => {
        const {error, stdout, stderr} = await execAsync("git pull");
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
        const userId = args[0].replace(/[<@!>]/g, "");
        const key = args[1];
        const layer = args[2] || "profile";
        const value = args.slice(3).join(" ");

        if (!userId || !key) {
            return "FAIL!\nUsage: data <user> <key> [layer] [value]";
        }
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

        obj[key] = value;
        await obj.save();
        return `OK!\nSet ${key} to ${value} for ${userId} in layer ${layer}`;
    }),
    "help": () => {
        return "FAIL!\nNot yet!"
    }
}

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
        
        let output;
        if (commands[command]) {
            output = await commands[command](interaction, args);
        } else {
            output = `command not found: ${command}`;
        }

        return await interaction.reply({ content: `\`# ${fullCommand}\`\n\`\`\`${output}\`\`\``, flags: MessageFlags.Ephemeral });
    }
}