if (!process.env.DB_NAME) {
    const path = require("path");
    require("dotenv").config({ path: [path.resolve(__dirname, "../../.env"), path.resolve(__dirname, "../.env")] });
}
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: "postgres",
        logging: false,
    }
);

module.exports = sequelize;
