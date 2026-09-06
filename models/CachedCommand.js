const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class CachedCommand extends Model { }

    CachedCommand.init({
        name: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },

        id: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        sequelize,
        timestamps: true,
        modelName: 'CachedCommand',
    })

    return CachedCommand;
};