// =====================================================================
// MESSAGE MODEL - src/models/Message.js
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationId: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('staff', 'guest', 'system', 'maintenance', 'finance'),
      defaultValue: 'staff'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read', 'archived'),
      defaultValue: 'sent'
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'reservations',
        key: 'id'
      }
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['senderId'] },
      { fields: ['receiverId'] },
      { fields: ['type'] },
      { fields: ['status'] }
    ]
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    Message.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver'
    });
    
    Message.belongsTo(models.Reservation, {
      foreignKey: 'reservationId',
      as: 'reservation'
    });
  };

  return Message;
};