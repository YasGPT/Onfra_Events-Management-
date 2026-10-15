const sequelize = require("../config/database");
const { getEventModels } = require("../models");

/**
 * Validates and sanitizes a schema name to prevent SQL injection.
 * @param {string} schemaName
 */
function isValidSchemaName(schemaName) {
    return /^event_[a-z0-9_]{3,55}$/.test(schemaName);
}

/**
 * Creates and provisions a new event schema with all 36 tables and default data.
 * @param {string} schemaName - e.g., "event_techconf2026"
 */
async function provisionEventSchema(schemaName) {
    if (!isValidSchemaName(schemaName)) {
        throw new Error(
            `Invalid schema name '${schemaName}'. Must start with 'event_' and contain only lowercase letters, numbers, and underscores.`
        );
    }

    const transaction = await sequelize.transaction();

    try {
        // 1. Create the schema safely
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`, {
            transaction,
        });

        // 2. Instantiate and sync event models in the new schema
        const models = getEventModels(schemaName);
        const modelList = Object.values(models);

        for (const model of modelList) {
            await model.sync({ transaction });
        }

        // 3. Seed default sponsorship tiers (Gold, Silver, Bronze)
        const defaultTiers = [
            { name: "Gold", display_order: 1 },
            { name: "Silver", display_order: 2 },
            { name: "Bronze", display_order: 3 },
        ];

        for (const tier of defaultTiers) {
            await models.SponsorshipTier.findOrCreate({
                where: { name: tier.name },
                defaults: tier,
                transaction,
            });
        }

        await transaction.commit();
        console.log(`Schema '${schemaName}' provisioned successfully.`);
        return { success: true, schemaName };
    } catch (error) {
        await transaction.rollback();
        console.error(`Failed to provision schema '${schemaName}':`, error);
        throw error;
    }
}

module.exports = {
    isValidSchemaName,
    provisionEventSchema,
};
