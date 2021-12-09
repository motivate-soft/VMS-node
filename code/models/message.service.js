const db = require('./db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await db.Message.findAll();
}

async function getById(id) {
    return await getMessage(id);
}

async function create(params) {
    // validate
    if (await db.Message.findOne({ where: { messageId: params.messageId } })) {
        throw 'Message ID "' + params.messageId + '" is already taken';
    }

    // save message
    await db.Message.create(params);
}

async function update(id, params) {
    const message = await getMessage(id);

    // validate
    const messageIdChanged = params.messageId && message.messageId !== params.messageId;
    if (messageIdChanged && await db.Message.findOne({ where: { messageId: params.messageId } })) {
        throw 'Message ID "' + params.messageId + '" is already taken';
    }
    // copy params to message and save
    Object.assign(message, params);
    await message.save();

    return message.get();
}

async function _delete(id) {
    const message = await getMessage(id);
    await message.destroy();
}

// helper functions

async function getMessage(id) {
    const message = await db.Message.findByPk(id);
    if (!message) throw 'Data not found';
    return message;
}