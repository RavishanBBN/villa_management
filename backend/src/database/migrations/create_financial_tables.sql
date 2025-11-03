-- =====================================================================
-- FINANCIAL SYSTEM DATABASE MIGRATION
-- Automated Accounting, Double-Entry Bookkeeping, Budgets, and Taxes
-- =====================================================================

-- Create Accounts Table (Chart of Accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountCode" VARCHAR(20) NOT NULL UNIQUE,
  "accountName" VARCHAR(100) NOT NULL,
  "accountType" VARCHAR(20) NOT NULL CHECK ("accountType" IN ('asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_sales')),
  category VARCHAR(50) NOT NULL,
  "parentAccountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "normalBalance" VARCHAR(10) NOT NULL CHECK ("normalBalance" IN ('debit', 'credit')),
  "currentBalance" DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR(3) DEFAULT 'LKR' NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
  "isSystemAccount" BOOLEAN DEFAULT FALSE NOT NULL,
  description TEXT,
  "taxApplicable" BOOLEAN DEFAULT FALSE NOT NULL,
  "reconciliationRequired" BOOLEAN DEFAULT FALSE NOT NULL,
  "lastReconciliationDate" TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts("accountType");
CREATE INDEX IF NOT EXISTS idx_accounts_category ON accounts(category);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts("parentAccountId");
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts("isActive");

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionNumber" VARCHAR(50) NOT NULL UNIQUE,
  "transactionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "transactionType" VARCHAR(30) NOT NULL CHECK ("transactionType" IN (
    'revenue', 'payment_received', 'payment_made', 'expense', 'refund',
    'transfer', 'adjustment', 'depreciation', 'tax', 'salary',
    'advance_deposit', 'other'
  )),
  description TEXT NOT NULL,
  "totalAmount" DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'LKR' NOT NULL,
  "exchangeRate" DECIMAL(10, 6) DEFAULT 1.0 NOT NULL,
  "baseAmount" DECIMAL(15, 2) NOT NULL,
  "reservationId" UUID REFERENCES reservations(id) ON DELETE SET NULL,
  "invoiceId" UUID REFERENCES invoices(id) ON DELETE SET NULL,
  "paymentId" UUID REFERENCES payments(id) ON DELETE SET NULL,
  "expenseId" UUID REFERENCES expenses(id) ON DELETE SET NULL,
  "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reversed', 'cancelled')),
  "isReconciled" BOOLEAN DEFAULT FALSE NOT NULL,
  "reconciledAt" TIMESTAMP,
  "reconciledBy" UUID REFERENCES users(id) ON DELETE SET NULL,
  "taxAmount" DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  "taxRate" DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  "isAutomated" BOOLEAN DEFAULT FALSE NOT NULL,
  "sourceSystem" VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_number ON transactions("transactionNumber");
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions("transactionDate");
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions("transactionType");
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reservation ON transactions("reservationId");
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions("invoiceId");
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions("paymentId");
CREATE INDEX IF NOT EXISTS idx_transactions_expense ON transactions("expenseId");
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled ON transactions("isReconciled");
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions("userId");

-- Create Journal Entries Table (Double-Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "accountId" UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  "entryType" VARCHAR(10) NOT NULL CHECK ("entryType" IN ('debit', 'credit')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0.01),
  currency VARCHAR(3) DEFAULT 'LKR' NOT NULL,
  "exchangeRate" DECIMAL(10, 6) DEFAULT 1.0 NOT NULL,
  "baseAmount" DECIMAL(15, 2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for journal entries
CREATE INDEX IF NOT EXISTS idx_journal_transaction ON journal_entries("transactionId");
CREATE INDEX IF NOT EXISTS idx_journal_account ON journal_entries("accountId");
CREATE INDEX IF NOT EXISTS idx_journal_type ON journal_entries("entryType");
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries("createdAt");

-- Create Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "budgetName" VARCHAR(100) NOT NULL,
  "budgetType" VARCHAR(20) NOT NULL CHECK ("budgetType" IN ('annual', 'quarterly', 'monthly', 'project', 'department')),
  "accountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category VARCHAR(50),
  department VARCHAR(50),
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "budgetedAmount" DECIMAL(15, 2) NOT NULL,
  "actualAmount" DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  variance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  "variancePercent" DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR(3) DEFAULT 'LKR' NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  "approvedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
  "approvedAt" TIMESTAMP,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  "alertThreshold" DECIMAL(5, 2) DEFAULT 80.00 NOT NULL,
  "alertSent" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets("budgetType");
CREATE INDEX IF NOT EXISTS idx_budgets_account ON budgets("accountId");
CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets("startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_department ON budgets(department);

-- Create Tax Configurations Table
CREATE TABLE IF NOT EXISTS tax_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "taxName" VARCHAR(100) NOT NULL,
  "taxCode" VARCHAR(20) NOT NULL UNIQUE,
  "taxType" VARCHAR(30) NOT NULL CHECK ("taxType" IN ('vat', 'service_charge', 'tourism_tax', 'income_tax', 'withholding_tax', 'other')),
  "taxRate" DECIMAL(5, 2) NOT NULL,
  "calculationMethod" VARCHAR(20) DEFAULT 'percentage' CHECK ("calculationMethod" IN ('percentage', 'fixed_amount', 'tiered')),
  "applicableOn" VARCHAR(20) DEFAULT 'revenue' CHECK ("applicableOn" IN ('revenue', 'expense', 'both')),
  "accountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo" DATE,
  "isCompound" BOOLEAN DEFAULT FALSE NOT NULL,
  "compoundOrder" INTEGER DEFAULT 0 NOT NULL,
  "isInclusive" BOOLEAN DEFAULT FALSE NOT NULL,
  tiers JSONB DEFAULT '[]',
  exemptions JSONB DEFAULT '[]',
  country CHAR(2) DEFAULT 'LK' NOT NULL,
  region VARCHAR(50),
  "reportingCategory" VARCHAR(50),
  "taxAuthorityName" VARCHAR(100),
  "taxRegistrationNumber" VARCHAR(50),
  "filingFrequency" VARCHAR(20) CHECK ("filingFrequency" IN ('monthly', 'quarterly', 'annually')),
  "nextFilingDate" DATE,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for tax configurations
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_code ON tax_configurations("taxCode");
CREATE INDEX IF NOT EXISTS idx_tax_type ON tax_configurations("taxType");
CREATE INDEX IF NOT EXISTS idx_tax_active ON tax_configurations("isActive");
CREATE INDEX IF NOT EXISTS idx_tax_effective ON tax_configurations("effectiveFrom", "effectiveTo");
CREATE INDEX IF NOT EXISTS idx_tax_country ON tax_configurations(country, region);

-- Create trigger to update updatedAt timestamp for accounts
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

-- Create trigger to update updatedAt timestamp for transactions
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Create trigger to update updatedAt timestamp for journal_entries
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entries_updated_at();

-- Create trigger to update updatedAt timestamp for budgets
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Create trigger to update updatedAt timestamp for tax_configurations
CREATE OR REPLACE FUNCTION update_tax_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tax_configurations_updated_at
  BEFORE UPDATE ON tax_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_configurations_updated_at();

-- Insert default Chart of Accounts
INSERT INTO accounts ("accountCode", "accountName", "accountType", category, "normalBalance", "isSystemAccount", description) VALUES
  ('1000', 'Cash', 'asset', 'current_asset', 'debit', TRUE, 'Cash on hand'),
  ('1010', 'Bank Account', 'asset', 'current_asset', 'debit', TRUE, 'Primary bank account'),
  ('1020', 'Accounts Receivable', 'asset', 'current_asset', 'debit', TRUE, 'Money owed by customers'),
  ('1030', 'Inventory', 'asset', 'current_asset', 'debit', TRUE, 'Stock and inventory'),
  ('1500', 'Property & Equipment', 'asset', 'fixed_asset', 'debit', TRUE, 'Fixed assets'),
  ('1510', 'Accumulated Depreciation', 'asset', 'fixed_asset', 'credit', TRUE, 'Accumulated depreciation'),
  ('2000', 'Accounts Payable', 'liability', 'current_liability', 'credit', TRUE, 'Money owed to suppliers'),
  ('2010', 'Tax Payable', 'liability', 'current_liability', 'credit', TRUE, 'Taxes owed'),
  ('2020', 'Advance Deposits', 'liability', 'current_liability', 'credit', TRUE, 'Guest advance deposits'),
  ('2500', 'Long-term Loans', 'liability', 'long_term_liability', 'credit', TRUE, 'Long-term debt'),
  ('3000', 'Owner''s Equity', 'equity', 'owner_equity', 'credit', TRUE, 'Owner investment'),
  ('3010', 'Retained Earnings', 'equity', 'retained_earnings', 'credit', TRUE, 'Accumulated profits'),
  ('4000', 'Room Revenue', 'revenue', 'operating_revenue', 'credit', TRUE, 'Room booking revenue'),
  ('4010', 'Service Revenue', 'revenue', 'operating_revenue', 'credit', TRUE, 'Additional services revenue'),
  ('4020', 'Other Revenue', 'revenue', 'other_revenue', 'credit', TRUE, 'Miscellaneous revenue'),
  ('5000', 'Salaries & Wages', 'expense', 'operating_expense', 'debit', TRUE, 'Staff salaries and wages'),
  ('5010', 'Utilities', 'expense', 'operating_expense', 'debit', TRUE, 'Electricity, water, internet'),
  ('5020', 'Maintenance & Repairs', 'expense', 'operating_expense', 'debit', TRUE, 'Property maintenance'),
  ('5030', 'Housekeeping Supplies', 'expense', 'operating_expense', 'debit', TRUE, 'Cleaning and supplies'),
  ('5100', 'Marketing & Advertising', 'expense', 'marketing_expense', 'debit', TRUE, 'Marketing costs'),
  ('5200', 'Administrative Expenses', 'expense', 'administrative_expense', 'debit', TRUE, 'General admin costs'),
  ('5300', 'Bank Charges', 'expense', 'financial_expense', 'debit', TRUE, 'Bank fees and charges'),
  ('5310', 'Interest Expense', 'expense', 'financial_expense', 'debit', TRUE, 'Interest on loans')
ON CONFLICT ("accountCode") DO NOTHING;

-- Insert default Tax Configurations
INSERT INTO tax_configurations ("taxName", "taxCode", "taxType", "taxRate", "calculationMethod", "applicableOn", "isActive", "effectiveFrom", country, description, "reportingCategory", "taxAuthorityName", "filingFrequency") VALUES
  ('VAT (Value Added Tax)', 'VAT-12.5', 'vat', 12.5, 'percentage', 'revenue', TRUE, '2024-01-01', 'LK', 'Standard VAT rate in Sri Lanka', 'Sales Tax', 'Inland Revenue Department', 'quarterly'),
  ('Service Charge', 'SC-10', 'service_charge', 10.0, 'percentage', 'revenue', TRUE, '2024-01-01', 'LK', '10% service charge on accommodation', 'Service Charges', NULL, NULL),
  ('Tourism Development Levy', 'TDL-1', 'tourism_tax', 1.0, 'percentage', 'revenue', TRUE, '2024-01-01', 'LK', 'Tourism development levy', 'Tourism Taxes', NULL, 'quarterly')
ON CONFLICT ("taxCode") DO NOTHING;

-- Success message
SELECT 'Financial system tables created successfully!' AS message;
