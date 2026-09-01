const { AttachmentBuilder } = require('discord.js');
const ownerId = process.env.OWNER_ID
const fs = require('fs');

module.exports = async (error, client, rawError) => {
    console.log(`[ERROR] ${error}`, rawError)

    const user = await client.users.fetch(ownerId);
    const attachments = [];
    const attachmentsRef = [];
    const errorTooLong = `${error}`.length > 1000;

    if (errorTooLong) {
        fs.appendFileSync('error.txt', `${error}\n\n${rawError ? rawError.stack : ""}`);
        const attachment = new AttachmentBuilder('error.txt');
        attachments.push(attachment);
        attachmentsRef.push('error.txt');
    }
    if (rawError && rawError.stack) {
        fs.appendFileSync('errorLog.txt', `${rawError ? rawError.stack : ""}`);
        const attachment = new AttachmentBuilder('errorLog.txt');
        attachments.push(attachment);
        attachmentsRef.push('errorLog.txt');
    } 
    
    await user.send({ 
        content: `[ERROR] ${errorTooLong ? "(See file)" : error}`,
        files: attachments
    })

    for (const file of attachmentsRef) {
        fs.rmSync(file);
    }
}