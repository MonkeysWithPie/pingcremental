const database = require('./../helpers/database.js');

let cachedLatestVersion = null;

async function getLatestVersion(forceRefresh = false) {
    if (cachedLatestVersion && !forceRefresh) {
        return cachedLatestVersion;
    }

    const latestVersion = await database.Version.findOne({
        order: [['releasedAt', 'DESC']],
        attributes: ['verNum'],
    })
    if (latestVersion) {
        cachedLatestVersion = latestVersion.verNum;
        return cachedLatestVersion;
    }

    const [addedNullVer, ] = await database.Version.findOrCreate({
        where: { verNum: '0.0.0' },
        defaults: {
            importance: 'major',
            description: '- this is a placeholder and should be edited later',
        },
    });

    cachedLatestVersion = addedNullVer.verNum;
    return cachedLatestVersion;
}

module.exports = getLatestVersion;