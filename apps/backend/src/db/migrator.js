const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const { sequelize } = require('../config/database');

const migrator = new Umzug({
  migrations: {
    glob: ['migrations/*.js', { cwd: __dirname }],
    resolve: ({ name, path: migrationPath, context }) => {
      const migration = require(migrationPath);
      const queryInterface = context || sequelize.getQueryInterface();
      const Sequelize = sequelize.constructor;
      return {
        name,
        up: async () => {
          if (typeof migration.up === 'function') {
            return migration.up(queryInterface, Sequelize);
          }
          throw new Error(`Migration ${name} does not export an 'up' function.`);
        },
        down: async () => {
          if (typeof migration.down === 'function') {
            return migration.down(queryInterface, Sequelize);
          }
          throw new Error(`Migration ${name} does not export a 'down' function.`);
        },
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'SequelizeMeta',
  }),
  logger: console,
});

const runCli = async () => {
  const command = process.argv[2] || 'status';

  try {
    switch (command) {
      case 'up': {
        console.log('[Migrator] Applying pending migrations...');
        const executed = await migrator.up();
        if (executed.length === 0) {
          console.log('[Migrator] No pending migrations to apply. Database is up to date.');
        } else {
          console.log(`[Migrator] Successfully applied ${executed.length} migration(s):`);
          executed.forEach((m) => console.log(`  - ${m.name}`));
        }
        break;
      }
      case 'down': {
        console.log('[Migrator] Reverting last migration...');
        const reverted = await migrator.down();
        if (reverted.length === 0) {
          console.log('[Migrator] No executed migrations to revert.');
        } else {
          console.log(`[Migrator] Successfully reverted ${reverted.length} migration(s):`);
          reverted.forEach((m) => console.log(`  - ${m.name}`));
        }
        break;
      }
      case 'status': {
        const [executed, pending] = await Promise.all([
          migrator.executed(),
          migrator.pending(),
        ]);
        console.log('\n=== Migration Status ===');
        console.log(`Executed (${executed.length}):`);
        executed.forEach((m) => console.log(`  [X] ${m.name}`));
        console.log(`Pending (${pending.length}):`);
        pending.forEach((m) => console.log(`  [ ] ${m.name}`));
        console.log('========================\n');
        break;
      }
      default: {
        console.log(`Unknown command: ${command}`);
        console.log('Usage: node src/db/migrator.js [up|down|status]');
        process.exit(1);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('[Migrator] Migration command failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runCli();
}

module.exports = {
  migrator,
};
