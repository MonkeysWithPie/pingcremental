let emojiCache = null;

async function initEmojis(client) {
    if (!client.application.name) {
        await client.application.fetch();
    }

    const emojis = await client.application.emojis.fetch();
    emojiCache = new Map();
    emojis.forEach(emoji => {
        emojiCache.set(emoji.name, `<:${emoji.name}:${emoji.id}>`);
    });
}

function getEmoji(name, alternate = null) {
    if (!emojiCache) {
        return `🟥`; // if emojis aren't initialized yet somehow
    }
    return emojiCache.get(name) || alternate || `:${name}:`;
}

module.exports = { initEmojis, getEmoji };