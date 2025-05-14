const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Badge extends Model { }

    Badge.init({
        dbId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        obtainable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'Badge',
    })

    return Badge;
};