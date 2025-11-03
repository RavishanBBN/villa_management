/**
 * Accounting Tab - Automated Double-Entry Bookkeeping System
 * Features: Chart of Accounts, Transaction Ledger, Financial Reports, Budgets
 */

import React, { useState, useEffect } from 'react';
import useAccounting from '../../hooks/useAccounting';
import './Accounting.css';

const Accounting = () => {
  const {
    // System
    isInitialized,
    initializeSystem,

    // Chart of Accounts
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,

    // Transactions
    transactions,
    transactionsLoading,
    transactionsError,
    loadTransactions,
    getTransactionDetails,
    reverseTransaction,

    // Financial Reports
    profitLossStatement,
    balanceSheet,
    cashFlowStatement,
    reportsLoading,
    reportsError,
    loadAllReports,

    // Budgets
    budgets,
    budgetsLoading,
    loadBudgets,

    // Dashboard
    dashboard,
    dashboardLoading,
    loadDashboard
  } = useAccounting();

  // UI State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [accountFilter, setAccountFilter] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    transactionType: 'all'
  });
  const [reportDates, setReportDates] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Initialize on mount
  useEffect(() => {
    if (activeSection === 'dashboard') {
      loadDashboard(reportDates.startDate, reportDates.endDate);
    }
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle system initialization
  const handleInitialize = async () => {
    try {
      await initializeSystem();
      alert('Accounting system initialized successfully!');
      loadAccounts();
    } catch (error) {
      alert('Failed to initialize system: ' + error.message);
    }
  };

  // Handle load transactions
  const handleLoadTransactions = () => {
    const filters = {};
    if (transactionFilter.startDate) filters.startDate = transactionFilter.startDate;
    if (transactionFilter.endDate) filters.endDate = transactionFilter.endDate;
    if (transactionFilter.transactionType !== 'all') filters.transactionType = transactionFilter.transactionType;
    loadTransactions(filters);
  };

  // Handle load reports
  const handleLoadReports = () => {
    loadAllReports(reportDates.startDate, reportDates.endDate);
  };

  // Filter accounts by type
  const filteredAccounts = accounts.filter(acc =>
    accountFilter === 'all' || acc.accountType === accountFilter
  );

  // Group accounts by type
  const accountsByType = accounts.reduce((groups, account) => {
    const type = account.accountType;
    if (!groups[type]) groups[type] = [];
    groups[type].push(account);
    return groups;
  }, {});

  // Render initialization screen if not initialized
  if (!isInitialized && activeSection !== 'dashboard') {
    return (
      <div className="accounting-container">
        <div className="initialization-screen">
          <div className="init-icon">💰</div>
          <h2>Automated Accounting System</h2>
          <p>The accounting system has not been initialized yet.</p>
          <p>Click the button below to create the default Chart of Accounts and set up double-entry bookkeeping.</p>
          <button
            onClick={handleInitialize}
            className="btn-primary"
            disabled={accountsLoading}
          >
            {accountsLoading ? 'Initializing...' : 'Initialize Accounting System'}
          </button>
          {accountsError && <div className="error-message">{accountsError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-container">
      {/* Header */}
      <div className="accounting-header">
        <h1>💰 Automated Accounting System</h1>
        <p>Double-Entry Bookkeeping | Real-Time Financial Reports</p>
      </div>

      {/* Navigation Tabs */}
      <div className="accounting-nav">
        <button
          className={activeSection === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveSection('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeSection === 'accounts' ? 'active' : ''}
          onClick={() => { setActiveSection('accounts'); loadAccounts(); }}
        >
          📋 Chart of Accounts
        </button>
        <button
          className={activeSection === 'transactions' ? 'active' : ''}
          onClick={() => { setActiveSection('transactions'); handleLoadTransactions(); }}
        >
          📖 Transaction Ledger
        </button>
        <button
          className={activeSection === 'reports' ? 'active' : ''}
          onClick={() => { setActiveSection('reports'); handleLoadReports(); }}
        >
          📈 Financial Reports
        </button>
        <button
          className={activeSection === 'budgets' ? 'active' : ''}
          onClick={() => { setActiveSection('budgets'); loadBudgets(); }}
        >
          🎯 Budgets
        </button>
      </div>

      {/* Dashboard Section */}
      {activeSection === 'dashboard' && (
        <div className="accounting-section">
          <div className="section-header">
            <h2>Financial Dashboard</h2>
            <div className="date-filters">
              <input
                type="date"
                value={reportDates.startDate}
                onChange={(e) => setReportDates({...reportDates, startDate: e.target.value})}
              />
              <span>to</span>
              <input
                type="date"
                value={reportDates.endDate}
                onChange={(e) => setReportDates({...reportDates, endDate: e.target.value})}
              />
              <button
                onClick={() => loadDashboard(reportDates.startDate, reportDates.endDate)}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
          </div>

          {dashboardLoading ? (
            <div className="loading">Loading dashboard...</div>
          ) : dashboard ? (
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Total Revenue</h3>
                <div className="card-value revenue">{formatCurrency(dashboard.profitLoss?.totalRevenue || 0)}</div>
              </div>
              <div className="dashboard-card">
                <h3>Total Expenses</h3>
                <div className="card-value expense">{formatCurrency(dashboard.profitLoss?.totalExpenses || 0)}</div>
              </div>
              <div className="dashboard-card">
                <h3>Net Profit</h3>
                <div className="card-value profit">{formatCurrency(dashboard.profitLoss?.netProfit || 0)}</div>
              </div>
              <div className="dashboard-card">
                <h3>Total Assets</h3>
                <div className="card-value">{formatCurrency(dashboard.balanceSheet?.totalAssets || 0)}</div>
              </div>
              <div className="dashboard-card">
                <h3>Total Liabilities</h3>
                <div className="card-value">{formatCurrency(dashboard.balanceSheet?.totalLiabilities || 0)}</div>
              </div>
              <div className="dashboard-card">
                <h3>Total Equity</h3>
                <div className="card-value">{formatCurrency(dashboard.balanceSheet?.totalEquity || 0)}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Load dashboard to see financial metrics</p>
              <button onClick={() => loadDashboard(reportDates.startDate, reportDates.endDate)}>
                Load Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chart of Accounts Section */}
      {activeSection === 'accounts' && (
        <div className="accounting-section">
          <div className="section-header">
            <h2>Chart of Accounts</h2>
            <div className="filters">
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                <option value="all">All Account Types</option>
                <option value="asset">Assets</option>
                <option value="liability">Liabilities</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expenses</option>
              </select>
              <button onClick={loadAccounts} className="btn-secondary">Refresh</button>
            </div>
          </div>

          {accountsLoading ? (
            <div className="loading">Loading accounts...</div>
          ) : accountsError ? (
            <div className="error-message">{accountsError}</div>
          ) : (
            <div className="accounts-table-container">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Current Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(account => (
                    <tr key={account.id}>
                      <td><strong>{account.accountCode}</strong></td>
                      <td>{account.accountName}</td>
                      <td><span className={`badge badge-${account.accountType}`}>{account.accountType}</span></td>
                      <td>{account.category || '-'}</td>
                      <td className={account.normalBalance === 'debit' ? 'debit-amount' : 'credit-amount'}>
                        {formatCurrency(account.currentBalance)}
                      </td>
                      <td>
                        <span className={`status ${account.isActive ? 'active' : 'inactive'}`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAccounts.length === 0 && (
                <div className="empty-state">No accounts found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transaction Ledger Section */}
      {activeSection === 'transactions' && (
        <div className="accounting-section">
          <div className="section-header">
            <h2>Transaction Ledger (Journal Entries)</h2>
            <div className="transaction-filters">
              <input
                type="date"
                value={transactionFilter.startDate}
                onChange={(e) => setTransactionFilter({...transactionFilter, startDate: e.target.value})}
              />
              <input
                type="date"
                value={transactionFilter.endDate}
                onChange={(e) => setTransactionFilter({...transactionFilter, endDate: e.target.value})}
              />
              <select
                value={transactionFilter.transactionType}
                onChange={(e) => setTransactionFilter({...transactionFilter, transactionType: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
              <button onClick={handleLoadTransactions} className="btn-secondary">Search</button>
            </div>
          </div>

          {transactionsLoading ? (
            <div className="loading">Loading transactions...</div>
          ) : transactionsError ? (
            <div className="error-message">{transactionsError}</div>
          ) : (
            <div className="transactions-list">
              {transactions.map(txn => (
                <div key={txn.id} className="transaction-card">
                  <div className="transaction-header">
                    <div className="transaction-info">
                      <strong>{txn.transactionNumber}</strong>
                      <span className={`badge badge-${txn.transactionType}`}>{txn.transactionType}</span>
                      <span className="transaction-date">{formatDate(txn.transactionDate)}</span>
                    </div>
                    <div className="transaction-amount">
                      {formatCurrency(txn.totalAmount)}
                    </div>
                  </div>
                  <div className="transaction-description">{txn.description}</div>
                  {txn.JournalEntries && txn.JournalEntries.length > 0 && (
                    <div className="journal-entries">
                      <table className="journal-table">
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Debit</th>
                            <th>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txn.JournalEntries.map(entry => (
                            <tr key={entry.id}>
                              <td>{entry.Account?.accountName || 'Unknown Account'}</td>
                              <td className="debit-amount">
                                {entry.entryType === 'debit' ? formatCurrency(entry.amount) : '-'}
                              </td>
                              <td className="credit-amount">
                                {entry.entryType === 'credit' ? formatCurrency(entry.amount) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="empty-state">No transactions found for the selected period</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Financial Reports Section */}
      {activeSection === 'reports' && (
        <div className="accounting-section">
          <div className="section-header">
            <h2>Financial Reports</h2>
            <div className="date-filters">
              <input
                type="date"
                value={reportDates.startDate}
                onChange={(e) => setReportDates({...reportDates, startDate: e.target.value})}
              />
              <span>to</span>
              <input
                type="date"
                value={reportDates.endDate}
                onChange={(e) => setReportDates({...reportDates, endDate: e.target.value})}
              />
              <button onClick={handleLoadReports} className="btn-primary">Generate Reports</button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="loading">Generating reports...</div>
          ) : reportsError ? (
            <div className="error-message">{reportsError}</div>
          ) : (
            <div className="reports-container">
              {/* Profit & Loss Statement */}
              {profitLossStatement && (
                <div className="report-card">
                  <h3>📊 Profit & Loss Statement</h3>
                  <div className="report-period">
                    {formatDate(profitLossStatement.period.startDate)} - {formatDate(profitLossStatement.period.endDate)}
                  </div>
                  <table className="report-table">
                    <tbody>
                      <tr className="section-header-row">
                        <td><strong>REVENUE</strong></td>
                        <td></td>
                      </tr>
                      {profitLossStatement.revenue?.breakdown?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="indent">{item.accountName}</td>
                          <td className="amount revenue">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td><strong>Total Revenue</strong></td>
                        <td className="amount revenue"><strong>{formatCurrency(profitLossStatement.revenue?.total)}</strong></td>
                      </tr>

                      <tr className="section-header-row">
                        <td><strong>EXPENSES</strong></td>
                        <td></td>
                      </tr>
                      {profitLossStatement.expenses?.breakdown?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="indent">{item.accountName}</td>
                          <td className="amount expense">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td><strong>Total Expenses</strong></td>
                        <td className="amount expense"><strong>{formatCurrency(profitLossStatement.expenses?.total)}</strong></td>
                      </tr>

                      <tr className="final-row">
                        <td><strong>NET PROFIT</strong></td>
                        <td className={`amount ${profitLossStatement.netProfit >= 0 ? 'profit' : 'loss'}`}>
                          <strong>{formatCurrency(profitLossStatement.netProfit)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Balance Sheet */}
              {balanceSheet && (
                <div className="report-card">
                  <h3>📑 Balance Sheet</h3>
                  <div className="report-period">As of {formatDate(balanceSheet.asOfDate)}</div>
                  <table className="report-table">
                    <tbody>
                      <tr className="section-header-row">
                        <td><strong>ASSETS</strong></td>
                        <td></td>
                      </tr>
                      {balanceSheet.assets?.breakdown?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="indent">{item.accountName}</td>
                          <td className="amount">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td><strong>Total Assets</strong></td>
                        <td className="amount"><strong>{formatCurrency(balanceSheet.assets?.total)}</strong></td>
                      </tr>

                      <tr className="section-header-row">
                        <td><strong>LIABILITIES</strong></td>
                        <td></td>
                      </tr>
                      {balanceSheet.liabilities?.breakdown?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="indent">{item.accountName}</td>
                          <td className="amount">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td><strong>Total Liabilities</strong></td>
                        <td className="amount"><strong>{formatCurrency(balanceSheet.liabilities?.total)}</strong></td>
                      </tr>

                      <tr className="section-header-row">
                        <td><strong>EQUITY</strong></td>
                        <td></td>
                      </tr>
                      {balanceSheet.equity?.breakdown?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="indent">{item.accountName}</td>
                          <td className="amount">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td><strong>Total Equity</strong></td>
                        <td className="amount"><strong>{formatCurrency(balanceSheet.equity?.total)}</strong></td>
                      </tr>

                      <tr className="final-row">
                        <td><strong>TOTAL LIABILITIES & EQUITY</strong></td>
                        <td className="amount">
                          <strong>{formatCurrency((balanceSheet.liabilities?.total || 0) + (balanceSheet.equity?.total || 0))}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="balance-check">
                    {balanceSheet.isBalanced ? (
                      <span className="balanced">✅ Assets = Liabilities + Equity (Balanced)</span>
                    ) : (
                      <span className="unbalanced">⚠️ Balance sheet is not balanced!</span>
                    )}
                  </div>
                </div>
              )}

              {/* Cash Flow Statement */}
              {cashFlowStatement && (
                <div className="report-card">
                  <h3>💵 Cash Flow Statement</h3>
                  <div className="report-period">
                    {formatDate(cashFlowStatement.period.startDate)} - {formatDate(cashFlowStatement.period.endDate)}
                  </div>
                  <table className="report-table">
                    <tbody>
                      <tr className="section-header-row">
                        <td><strong>OPERATING ACTIVITIES</strong></td>
                        <td></td>
                      </tr>
                      {cashFlowStatement.operatingActivities?.details?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="indent">{item.description}</td>
                          <td className="amount">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td><strong>Net Cash from Operating Activities</strong></td>
                        <td className="amount"><strong>{formatCurrency(cashFlowStatement.operatingActivities?.total)}</strong></td>
                      </tr>

                      <tr className="final-row">
                        <td><strong>NET INCREASE IN CASH</strong></td>
                        <td className={`amount ${cashFlowStatement.netCashFlow >= 0 ? 'profit' : 'loss'}`}>
                          <strong>{formatCurrency(cashFlowStatement.netCashFlow)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {!profitLossStatement && !balanceSheet && !cashFlowStatement && (
                <div className="empty-state">
                  <p>Select a date range and click "Generate Reports" to view financial statements</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Budgets Section */}
      {activeSection === 'budgets' && (
        <div className="accounting-section">
          <div className="section-header">
            <h2>Budget Management</h2>
            <button className="btn-primary">Create New Budget</button>
          </div>

          {budgetsLoading ? (
            <div className="loading">Loading budgets...</div>
          ) : (
            <div className="budgets-list">
              {budgets.length > 0 ? (
                budgets.map(budget => (
                  <div key={budget.id} className="budget-card">
                    <h4>{budget.budgetName}</h4>
                    <div className="budget-details">
                      <div>Type: {budget.budgetType}</div>
                      <div>Period: {formatDate(budget.startDate)} - {formatDate(budget.endDate)}</div>
                      <div>Budgeted: {formatCurrency(budget.budgetedAmount)}</div>
                      <div>Actual: {formatCurrency(budget.actualAmount)}</div>
                      <div>Variance: {formatCurrency(budget.variance)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No budgets created yet</p>
                  <p>Create a budget to track planned vs actual expenses</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Accounting;
