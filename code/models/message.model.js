const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        messageId: { type: DataTypes.STRING, allowNull: false },
        esn: { type: DataTypes.STRING, allowNull: false },
        timeStamp: { type: DataTypes.STRING, allowNull: false },
        unixTime: { type: DataTypes.STRING, allowNull: false },
        encodeValue: { type: DataTypes.STRING, allowNull: false },
        decodeValue: { type: DataTypes.TEXT, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: true },
        level: { type: DataTypes.INTEGER, allowNull: false },
    };

    return sequelize.define('Message', attributes);
}