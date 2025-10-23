import React from 'react';

const InventoryManagement = ({
  inventoryItems,
  inventoryDashboard,
  inventoryFilter,
  setInventoryFilter,
  setShowInventoryModal,
  setSelectedInventoryItem,
  resetInventoryForm,
  setInventoryForm,
  setShowStockInModal,
  setShowStockOutModal
}) => {
  
  const formatCurrency = (amount, currency = 'LKR') => {
    const numAmount = parseFloat(amount) || 0;
    return `${currency} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="content-section">
      {/* Inventory Dashboard Header */}
      <div className="section-header">
        <h2>📦 Inventory Management</h2>
        <div className="header-actions">
          <button
            onClick={() => {
              setSelectedInventoryItem(null);
              resetInventoryForm();
              setShowInventoryModal(true);
            }}
            className="btn-primary"
          >
            ➕ Add New Item
          </button>
        </div>
      </div>

      {/* Inventory Dashboard Statistics */}
      {inventoryDashboard && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Total Items</div>
              <div className="stat-value">{inventoryDashboard.summary.totalItems}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Active Items</div>
              <div className="stat-value">{inventoryDashboard.summary.activeItems}</div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-label">Low Stock</div>
              <div className="stat-value">{inventoryDashboard.summary.lowStockItems}</div>
            </div>
          </div>
          
          <div className="stat-card danger">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-label">Out of Stock</div>
              <div className="stat-value">{inventoryDashboard.summary.outOfStockItems}</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-label">Total Value</div>
              <div className="stat-value">{formatCurrency(inventoryDashboard.summary.totalValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="inventory-filters">
        <div className="filter-group">
          <label>🔍 Search</label>
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={inventoryFilter.search}
            onChange={(e) => setInventoryFilter(prev => ({ ...prev, search: e.target.value }))}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>📂 Category</label>
          <select
            value={inventoryFilter.category}
            onChange={(e) => setInventoryFilter(prev => ({ ...prev, category: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="housekeeping">🧹 Housekeeping</option>
            <option value="kitchen">🍴 Kitchen</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="amenities">🎁 Amenities</option>
            <option value="office">📎 Office</option>
            <option value="other">📦 Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label>📊 Status</label>
          <select
            value={inventoryFilter.status}
            onChange={(e) => setInventoryFilter(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">✅ Active</option>
            <option value="inactive">❌ Inactive</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={inventoryFilter.lowStock}
              onChange={(e) => setInventoryFilter(prev => ({ ...prev, lowStock: e.target.checked }))}
            />
            <span>⚠️ Show Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="inventory-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Unit</th>
              <th>Cost/Unit</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                  📦 No inventory items found. Add your first item!
                </td>
              </tr>
            ) : (
              inventoryItems.map(item => {
                const stockLevel = item.currentStock <= item.minStock * 0.5 ? 'critical' : 
                                  item.currentStock <= item.minStock ? 'low' : 'good';
                const totalValue = item.currentStock * (parseFloat(item.costPerUnit) || 0);

                return (
                  <tr key={item.id} className={`stock-level-${stockLevel}`}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`category-badge category-${item.category}`}>
                        {item.category}
                      </span>
                    </td>
                    <td><code>{item.sku}</code></td>
                    <td>
                      <span className={`stock-badge stock-${stockLevel}`}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td>{item.minStock}</td>
                    <td>{item.unit}</td>
                    <td>{formatCurrency(item.costPerUnit || 0)}</td>
                    <td>{formatCurrency(totalValue)}</td>
                    <td>
                      <span className={`status-badge ${item.isActive ? 'status-active' : 'status-inactive'}`}>
                        {item.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setShowStockInModal(true);
                          }}
                          className="btn-action btn-success"
                          title="Add Stock"
                        >
                          📥 IN
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setShowStockOutModal(true);
                          }}
                          className="btn-action btn-danger"
                          title="Remove Stock"
                        >
                          📤 OUT
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setInventoryForm({
                              name: item.name,
                              category: item.category,
                              subcategory: item.subcategory || '',
                              description: item.description || '',
                              currentStock: item.currentStock,
                              minStock: item.minStock,
                              maxStock: item.maxStock || '',
                              unit: item.unit,
                              costPerUnit: item.costPerUnit || '',
                              supplierName: item.supplierName || '',
                              supplierContact: item.supplierContact || '',
                              location: item.location || '',
                              notes: item.notes || ''
                            });
                            setShowInventoryModal(true);
                          }}
                          className="btn-action btn-primary"
                          title="Edit Item"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Category Breakdown */}
      {inventoryDashboard && inventoryDashboard.categoryBreakdown && (
        <div className="inventory-category-breakdown">
          <h3>📊 Category Breakdown</h3>
          <div className="category-cards">
            {Object.entries(inventoryDashboard.categoryBreakdown).map(([category, data]) => (
              <div key={category} className="category-card">
                <h4>{category}</h4>
                <div className="category-stats">
                  <div className="category-stat">
                    <span className="stat-label">Items</span>
                    <span className="stat-value">{data.count}</span>
                  </div>
                  <div className="category-stat">
                    <span className="stat-label">Value</span>
                    <span className="stat-value">{formatCurrency(data.totalValue)}</span>
                  </div>
                  <div className="category-stat">
                    <span className="stat-label">Low Stock</span>
                    <span className="stat-value warning">{data.lowStock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
