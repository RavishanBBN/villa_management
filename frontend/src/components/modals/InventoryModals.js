import React from 'react';

const InventoryModals = ({
  // Inventory Item Modal
  showInventoryModal,
  setShowInventoryModal,
  selectedInventoryItem,
  inventoryForm,
  setInventoryForm,
  createInventoryItem,
  updateInventoryItem,
  loading,
  
  // Stock IN Modal
  showStockInModal,
  setShowStockInModal,
  stockTransactionForm,
  setStockTransactionForm,
  stockIn,
  
  // Stock OUT Modal
  showStockOutModal,
  setShowStockOutModal,
  stockOut,
  
  // Stock Adjust Modal
  showStockAdjustModal,
  setShowStockAdjustModal,
  stockAdjust,
  
  // Properties for stock OUT
  properties
}) => {
  
  return (
    <>
      {/* Add/Edit Inventory Item Modal */}
      {showInventoryModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedInventoryItem ? '✏️ Edit Inventory Item' : '➕ Add New Inventory Item'}</h2>
              <button onClick={() => setShowInventoryModal(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={inventoryForm.name}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Toilet Paper, Hand Soap"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={inventoryForm.category}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="housekeeping">🧹 Housekeeping</option>
                    <option value="kitchen">🍴 Kitchen</option>
                    <option value="maintenance">🔧 Maintenance</option>
                    <option value="amenities">🎁 Amenities</option>
                    <option value="office">📎 Office</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subcategory</label>
                  <input
                    type="text"
                    value={inventoryForm.subcategory}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, subcategory: e.target.value }))}
                    placeholder="Optional subcategory"
                  />
                </div>

                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={inventoryForm.unit}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, unit: e.target.value }))}
                    required
                  >
                    <option value="pieces">Pieces</option>
                    <option value="rolls">Rolls</option>
                    <option value="bottles">Bottles</option>
                    <option value="boxes">Boxes</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters</option>
                    <option value="packs">Packs</option>
                    <option value="sets">Sets</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    value={inventoryForm.currentStock}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, currentStock: e.target.value }))}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock Level *</label>
                  <input
                    type="number"
                    value={inventoryForm.minStock}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, minStock: e.target.value }))}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Stock Level</label>
                  <input
                    type="number"
                    value={inventoryForm.maxStock}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, maxStock: e.target.value }))}
                    min="0"
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Cost Per Unit (LKR)</label>
                  <input
                    type="number"
                    value={inventoryForm.costPerUnit}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, costPerUnit: e.target.value }))}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Storage Location</label>
                  <input
                    type="text"
                    value={inventoryForm.location}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Storage Room A, Shelf 3"
                  />
                </div>

                <div className="form-group">
                  <label>Supplier Name</label>
                  <input
                    type="text"
                    value={inventoryForm.supplierName}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Supplier Contact</label>
                  <input
                    type="text"
                    value={inventoryForm.supplierContact}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, supplierContact: e.target.value }))}
                    placeholder="Phone or email"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={inventoryForm.description}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description or specifications"
                    rows="2"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={inventoryForm.notes}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowInventoryModal(false)} 
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={selectedInventoryItem ? updateInventoryItem : createInventoryItem}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (selectedInventoryItem ? 'Update Item' : 'Create Item')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock IN Modal */}
      {showStockInModal && selectedInventoryItem && (
        <div className="modal-overlay" onClick={() => setShowStockInModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📥 Stock IN - {selectedInventoryItem.name}</h2>
              <button onClick={() => setShowStockInModal(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-content">
              <div className="stock-info-panel">
                <div className="info-item">
                  <span className="info-label">Current Stock:</span>
                  <span className="info-value">{selectedInventoryItem.currentStock} {selectedInventoryItem.unit}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Minimum Required:</span>
                  <span className="info-value">{selectedInventoryItem.minStock} {selectedInventoryItem.unit}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity to Add *</label>
                <input
                  type="number"
                  value={stockTransactionForm.quantity}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, quantity: e.target.value }))}
                  min="1"
                  required
                  placeholder={`Enter quantity in ${selectedInventoryItem.unit}`}
                />
              </div>

              <div className="form-group">
                <label>Unit Cost (LKR)</label>
                <input
                  type="number"
                  value={stockTransactionForm.unitCost}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, unitCost: e.target.value }))}
                  min="0"
                  step="0.01"
                  placeholder="Cost per unit"
                />
              </div>

              <div className="form-group">
                <label>Supplier Name</label>
                <input
                  type="text"
                  value={stockTransactionForm.supplierName}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="Supplier name"
                />
              </div>

              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={stockTransactionForm.invoiceNumber}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="Invoice or receipt number"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={stockTransactionForm.notes}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes"
                  rows="3"
                />
              </div>

              {stockTransactionForm.quantity && (
                <div className="calculation-preview">
                  <strong>New Stock Level:</strong> {parseInt(selectedInventoryItem.currentStock) + parseInt(stockTransactionForm.quantity || 0)} {selectedInventoryItem.unit}
                  {stockTransactionForm.unitCost && stockTransactionForm.quantity && (
                    <div>
                      <strong>Total Cost:</strong> LKR {(parseFloat(stockTransactionForm.unitCost) * parseInt(stockTransactionForm.quantity)).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowStockInModal(false)} 
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={stockIn}
                className="btn-success"
                disabled={loading || !stockTransactionForm.quantity}
              >
                {loading ? 'Adding...' : '📥 Add to Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock OUT Modal */}
      {showStockOutModal && selectedInventoryItem && (
        <div className="modal-overlay" onClick={() => setShowStockOutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 Stock OUT - {selectedInventoryItem.name}</h2>
              <button onClick={() => setShowStockOutModal(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-content">
              <div className="stock-info-panel">
                <div className="info-item">
                  <span className="info-label">Current Stock:</span>
                  <span className="info-value">{selectedInventoryItem.currentStock} {selectedInventoryItem.unit}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Minimum Required:</span>
                  <span className="info-value">{selectedInventoryItem.minStock} {selectedInventoryItem.unit}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity to Remove *</label>
                <input
                  type="number"
                  value={stockTransactionForm.quantity}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, quantity: e.target.value }))}
                  min="1"
                  max={selectedInventoryItem.currentStock}
                  required
                  placeholder={`Max: ${selectedInventoryItem.currentStock} ${selectedInventoryItem.unit}`}
                />
              </div>

              <div className="form-group">
                <label>Reason *</label>
                <select
                  value={stockTransactionForm.reason}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                >
                  <option value="">Select reason</option>
                  <option value="guest_use">Guest Use</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="damage">Damage/Breakage</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Staff Member *</label>
                <input
                  type="text"
                  value={stockTransactionForm.usedBy}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, usedBy: e.target.value }))}
                  placeholder="e.g., John Doe, Housekeeping Team"
                  required
                />
                <small className="form-hint">Who is taking/using this item?</small>
              </div>

              <div className="form-group">
                <label>Property/Unit</label>
                <select
                  value={stockTransactionForm.propertyId}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, propertyId: e.target.value }))}
                >
                  <option value="">Select property (optional)</option>
                  {properties && properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reservation ID</label>
                <input
                  type="text"
                  value={stockTransactionForm.reservationId}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, reservationId: e.target.value }))}
                  placeholder="Link to reservation (optional)"
                />
                <small className="form-hint">Enter confirmation number if related to a guest</small>
              </div>

              <div className="form-group">
                <label>Guest Name</label>
                <input
                  type="text"
                  value={stockTransactionForm.guestName}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, guestName: e.target.value }))}
                  placeholder="Guest name (if applicable)"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={stockTransactionForm.notes}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes"
                  rows="3"
                />
              </div>

              {stockTransactionForm.quantity && (
                <div className="calculation-preview">
                  <strong>New Stock Level:</strong> {parseInt(selectedInventoryItem.currentStock) - parseInt(stockTransactionForm.quantity || 0)} {selectedInventoryItem.unit}
                  {(parseInt(selectedInventoryItem.currentStock) - parseInt(stockTransactionForm.quantity || 0)) < selectedInventoryItem.minStock && (
                    <div className="warning-text">
                      ⚠️ Warning: Stock will fall below minimum level!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowStockOutModal(false)} 
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={stockOut}
                className="btn-danger"
                disabled={loading || !stockTransactionForm.quantity || !stockTransactionForm.reason}
              >
                {loading ? 'Removing...' : '📤 Remove from Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showStockAdjustModal && selectedInventoryItem && (
        <div className="modal-overlay" onClick={() => setShowStockAdjustModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔧 Adjust Stock - {selectedInventoryItem.name}</h2>
              <button onClick={() => setShowStockAdjustModal(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-content">
              <div className="stock-info-panel">
                <div className="info-item">
                  <span className="info-label">Current Stock:</span>
                  <span className="info-value">{selectedInventoryItem.currentStock} {selectedInventoryItem.unit}</span>
                </div>
              </div>

              <div className="form-group">
                <label>New Stock Quantity *</label>
                <input
                  type="number"
                  value={stockTransactionForm.quantity}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, quantity: e.target.value }))}
                  min="0"
                  required
                  placeholder="Enter correct stock quantity"
                />
              </div>

              <div className="form-group">
                <label>Reason for Adjustment *</label>
                <select
                  value={stockTransactionForm.reason}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                >
                  <option value="">Select reason</option>
                  <option value="physical_count">Physical Count/Audit</option>
                  <option value="found_discrepancy">Found Discrepancy</option>
                  <option value="damage">Damage Correction</option>
                  <option value="theft">Theft/Loss</option>
                  <option value="system_error">System Error Correction</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes *</label>
                <textarea
                  value={stockTransactionForm.notes}
                  onChange={(e) => setStockTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Explain the reason for this adjustment"
                  rows="3"
                  required
                />
              </div>

              {stockTransactionForm.quantity && (
                <div className="calculation-preview">
                  <strong>Current:</strong> {selectedInventoryItem.currentStock} {selectedInventoryItem.unit}
                  <br />
                  <strong>New:</strong> {stockTransactionForm.quantity} {selectedInventoryItem.unit}
                  <br />
                  <strong>Difference:</strong> {parseInt(stockTransactionForm.quantity) - parseInt(selectedInventoryItem.currentStock)} {selectedInventoryItem.unit}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowStockAdjustModal(false)} 
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={stockAdjust}
                className="btn-primary"
                disabled={loading || !stockTransactionForm.quantity || !stockTransactionForm.reason || !stockTransactionForm.notes}
              >
                {loading ? 'Adjusting...' : '🔧 Adjust Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryModals;
