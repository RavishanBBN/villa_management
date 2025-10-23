// =====================================================================
// INVOICE/DOCUMENT MODEL - src/models/Invoice.js
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('guest_invoice', 'supplier_bill', 'expense_receipt', 'utility_bill', 'other'),
      allowNull: false,
      defaultValue: 'guest_invoice'
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'reservations',
        key: 'id'
      }
    },
    expenseId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // Parties involved
    issuedTo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    issuedToEmail: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    issuedToAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    issuedFrom: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'Halcyon Rest'
    },
    issuedFromAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Financial details
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'LKR'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    // Line items (stored as JSON)
    lineItems: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    // Payment details
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'unpaid'
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // File storage
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    originalFileName: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Metadata
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Tracking
    createdBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'system'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isVoided: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    voidedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    voidReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['invoiceNumber'] },
      { fields: ['reservationId'] },
      { fields: ['type'] },
      { fields: ['paymentStatus'] },
      { fields: ['issueDate'] },
      { fields: ['dueDate'] }
    ]
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Reservation, {
      foreignKey: 'reservationId',
      as: 'reservation'
    });
  };

  // Generate invoice number
  Invoice.generateInvoiceNumber = async function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the latest invoice for this month
    const latestInvoice = await this.findOne({
      where: {
        invoiceNumber: {
          [sequelize.Sequelize.Op.like]: `INV-${year}${month}%`
        }
      },
      order: [['invoiceNumber', 'DESC']]
    });

    let sequence = 1;
    if (latestInvoice) {
      const lastSequence = parseInt(latestInvoice.invoiceNumber.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  };

  return Invoice;
};
