const { Model, DataTypes } = require("sequelize");
const { PrestigeLayers } = require("../helpers/commonEnums");

module.exports = (sequelize) => {
    class UserStats extends Model {}

    UserStats.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        layer: {
            type: DataTypes.ENUM(PrestigeLayers)
        },

        score: {
            type: DataTypes.NUMBER,
            defaultValue: 0,
        }
    }, {
        sequelize,
        modelName: "UserStat",
        timestamps: false,
    })

    return UserStats;
}