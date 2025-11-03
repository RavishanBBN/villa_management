// Quick script to initialize financial tables without full sync
const db = require('./src/models');

async function initFinancialTables() {
  try {
    console.log('🔄 Creating financial tables...');

    // Create tables in order (respecting dependencies)
    await db.Account.sync({ force: false });
    console.log('✅ Accounts table ready');

    await db.Transaction.sync({ force: false });
    console.log('✅ Transactions table ready');

    await db.JournalEntry.sync({ force: false });
    console.log('✅ Journal Entries table ready');

    await db.Budget.sync({ force: false });
    console.log('✅ Budgets table ready');

    await db.TaxConfiguration.sync({ force: false });
    console.log('✅ Tax Configurations table ready');

    console.log('\n🎉 All financial tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initFinancialTables();
