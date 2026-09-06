const database = require("./database.js");

const cache = {};

async function cacheCommandIds() {
    const commands = await database.CachedCommand.findAll();
    for (const command of commands) {
        cache[command.name] = command.id;
    }
}

function getEmbeddedCommand(commandName) {
    const baseCommand = commandName.split(" ")[0];
    const cached = cache[baseCommand];

    if (!cached) {
        console.warn(`[WARN] no command ID available for ${commandName} (${baseCommand})`);
        return `</${commandName}:NOID>`;
    }

    return `</${commandName}:${cached}>`;
}

module.exports = { getEmbeddedCommand, cacheCommandIds };