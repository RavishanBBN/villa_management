// =====================================================================
// TAX CONFIGURATION MODEL - Tax Rules and Calculations
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const TaxConfiguration = sequelize.define('TaxConfiguration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    taxName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tax name (e.g., "VAT", "Service Charge", "Tourism Tax")'
    },
    taxCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Unique tax code'
    },
    taxType: {
      type: DataTypes.ENUM('vat', 'service_charge', 'tourism_tax', 'income_tax', 'withholding_tax', 'other'),
      allowNull: false
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'Tax rate percentage (e.g., 12.5 for 12.5%)'
    },
    calculationMethod: {
      type: DataTypes.ENUM('percentage', 'fixed_amount', 'tiered'),
      defaultValue: 'percentage',
      allowNull: false
    },
    applicableOn: {
      type: DataTypes.ENUM('revenue', 'expense', 'both'),
      defaultValue: 'revenue',
      allowNull: false,
      comment: 'What this tax applies to'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Tax liability account'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date when this tax rate becomes effective'
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when this tax rate expires'
    },
    isCompound: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether tax is calculated on top of other taxes'
    },
    compoundOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Order of calculation for compound taxes'
    },
    isInclusive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether tax is included in the price'
    },
    // Tiered tax configuration
    tiers: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Tax tiers for tiered calculation [{ min, max, rate }]'
    },
    // Exemptions
    exemptions: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Exemption rules and conditions'
    },
    // Regional settings
    country: {
      type: DataTypes.STRING(2),
      defaultValue: 'LK',
      allowNull: false,
      comment: 'Country code (ISO 3166-1 alpha-2)'
    },
    region: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'State/Province/Region'
    },
    // Reporting
    reportingCategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Category for tax reporting'
    },
    taxAuthorityName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tax authority name'
    },
    taxRegistrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Business tax registration number'
    },
    filingFrequency: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
      allowNull: true,
      comment: 'How often tax needs to be filed'
    },
    nextFilingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional tax configuration'
    }
  }, {
    tableName: 'tax_configurations',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['taxCode'] },
      { fields: ['taxType'] },
      { fields: ['isActive'] },
      { fields: ['effectiveFrom', 'effectiveTo'] },
      { fields: ['country', 'region'] }
    ]
  });

  // Associations
  TaxConfiguration.associate = (models) => {
    TaxConfiguration.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'taxAccount'
    });
  };

  // Instance Methods
  TaxConfiguration.prototype.calculateTax = function(amount, date = new Date()) {
    // Check if tax is active and effective
    if (!this.isActive) return 0;
    if (date < this.effectiveFrom) return 0;
    if (this.effectiveTo && date > this.effectiveTo) return 0;

    let taxAmount = 0;

    switch (this.calculationMethod) {
      case 'percentage':
        if (this.isInclusive) {
          // Tax is included in the amount
          taxAmount = (amount * parseFloat(this.taxRate)) / (100 + parseFloat(this.taxRate));
        } else {
          // Tax is added to the amount
          taxAmount = (amount * parseFloat(this.taxRate)) / 100;
        }
        break;

      case 'fixed_amount':
        taxAmount = parseFloat(this.taxRate);
        break;

      case 'tiered':
        // Calculate tax based on tiers
        if (this.tiers && this.tiers.length > 0) {
          for (const tier of this.tiers) {
            if (amount >= tier.min && (!tier.max || amount <= tier.max)) {
              taxAmount = (amount * parseFloat(tier.rate)) / 100;
              break;
            }
          }
        }
        break;
    }

    return Math.round(taxAmount * 100) / 100; // Round to 2 decimal places
  };

  TaxConfiguration.prototype.isEffective = function(date = new Date()) {
    if (!this.isActive) return false;
    if (date < this.effectiveFrom) return false;
    if (this.effectiveTo && date > this.effectiveTo) return false;
    return true;
  };

  // Class Methods
  TaxConfiguration.getActiveTaxes = async function(applicableOn = null, date = new Date()) {
    const where = {
      isActive: true,
      effectiveFrom: { [sequelize.Sequelize.Op.lte]: date }
    };

    if (applicableOn) {
      where.applicableOn = applicableOn;
    }

    const taxes = await this.findAll({
      where,
      order: [['compoundOrder', 'ASC']]
    });

    return taxes.filter(tax => {
      return !tax.effectiveTo || date <= tax.effectiveTo;
    });
  };

  TaxConfiguration.calculateTotalTax = async function(amount, applicableOn, date = new Date()) {
    const taxes = await this.getActiveTaxes(applicableOn, date);

    let totalTax = 0;
    let baseAmount = amount;

    // Calculate simple taxes first
    const simpleTaxes = taxes.filter(t => !t.isCompound);
    for (const tax of simpleTaxes) {
      totalTax += tax.calculateTax(baseAmount, date);
    }

    // Calculate compound taxes
    const compoundTaxes = taxes.filter(t => t.isCompound);
    let compoundBase = baseAmount + totalTax;
    for (const tax of compoundTaxes) {
      const compoundTaxAmount = tax.calculateTax(compoundBase, date);
      totalTax += compoundTaxAmount;
      compoundBase += compoundTaxAmount;
    }

    return {
      baseAmount,
      totalTax: Math.round(totalTax * 100) / 100,
      totalAmount: Math.round((baseAmount + totalTax) * 100) / 100,
      taxBreakdown: taxes.map(tax => ({
        taxName: tax.taxName,
        taxCode: tax.taxCode,
        taxRate: tax.taxRate,
        taxAmount: tax.calculateTax(tax.isCompound ? compoundBase : baseAmount, date)
      }))
    };
  };

  TaxConfiguration.getDefaultTaxes = function() {
    return [
      {
        taxName: 'VAT (Value Added Tax)',
        taxCode: 'VAT-12.5',
        taxType: 'vat',
        taxRate: 12.5,
        calculationMethod: 'percentage',
        applicableOn: 'revenue',
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        country: 'LK',
        description: 'Standard VAT rate in Sri Lanka',
        reportingCategory: 'Sales Tax',
        taxAuthorityName: 'Inland Revenue Department',
        filingFrequency: 'quarterly'
      },
      {
        taxName: 'Service Charge',
        taxCode: 'SC-10',
        taxType: 'service_charge',
        taxRate: 10,
        calculationMethod: 'percentage',
        applicableOn: 'revenue',
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        country: 'LK',
        description: '10% service charge on accommodation',
        reportingCategory: 'Service Charges'
      },
      {
        taxName: 'Tourism Development Levy',
        taxCode: 'TDL-1',
        taxType: 'tourism_tax',
        taxRate: 1,
        calculationMethod: 'percentage',
        applicableOn: 'revenue',
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        country: 'LK',
        description: 'Tourism development levy',
        reportingCategory: 'Tourism Taxes',
        filingFrequency: 'quarterly'
      }
    ];
  };

  return TaxConfiguration;
};
