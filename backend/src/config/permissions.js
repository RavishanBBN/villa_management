// User Roles and Permissions Configuration

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  FRONT_DESK: 'front_desk',
  HOUSEKEEPING: 'housekeeping',
  MAINTENANCE: 'maintenance',
  FINANCE: 'finance'
};

const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',
  
  // Property Management
  PROPERTY_CREATE: 'property:create',
  PROPERTY_READ: 'property:read',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',
  
  // Reservation Management
  RESERVATION_CREATE: 'reservation:create',
  RESERVATION_READ: 'reservation:read',
  RESERVATION_UPDATE: 'reservation:update',
  RESERVATION_DELETE: 'reservation:delete',
  RESERVATION_CHECKIN: 'reservation:checkin',
  RESERVATION_CHECKOUT: 'reservation:checkout',
  RESERVATION_CANCEL: 'reservation:cancel',
  
  // Financial Management
  FINANCIAL_READ: 'financial:read',
  FINANCIAL_CREATE: 'financial:create',
  FINANCIAL_UPDATE: 'financial:update',
  FINANCIAL_DELETE: 'financial:delete',
  EXPENSE_APPROVE: 'expense:approve',
  REVENUE_MANAGE: 'revenue:manage',
  INVOICE_GENERATE: 'invoice:generate',
  PAYMENT_PROCESS: 'payment:process',
  
  // Inventory Management
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  STOCK_IN: 'stock:in',
  STOCK_OUT: 'stock:out',
  STOCK_ADJUST: 'stock:adjust',
  
  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  
  // Settings & Configuration
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  PRICING_MANAGE: 'pricing:manage',
  CALENDAR_MANAGE: 'calendar:manage',
  
  // Communication
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELETE: 'message:delete',
  
  // System
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_CONFIG: 'system:config'
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Super Admin has ALL permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.ADMIN]: [
    // User Management (limited)
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    
    // Property Management
    PERMISSIONS.PROPERTY_CREATE,
    PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE,
    PERMISSIONS.PROPERTY_DELETE,
    
    // Reservation Management
    PERMISSIONS.RESERVATION_CREATE,
    PERMISSIONS.RESERVATION_READ,
    PERMISSIONS.RESERVATION_UPDATE,
    PERMISSIONS.RESERVATION_DELETE,
    PERMISSIONS.RESERVATION_CHECKIN,
    PERMISSIONS.RESERVATION_CHECKOUT,
    PERMISSIONS.RESERVATION_CANCEL,
    
    // Financial Management
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.FINANCIAL_CREATE,
    PERMISSIONS.FINANCIAL_UPDATE,
    PERMISSIONS.EXPENSE_APPROVE,
    PERMISSIONS.REVENUE_MANAGE,
    PERMISSIONS.INVOICE_GENERATE,
    PERMISSIONS.PAYMENT_PROCESS,
    
    // Inventory Management
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.STOCK_IN,
    PERMISSIONS.STOCK_OUT,
    PERMISSIONS.STOCK_ADJUST,
    
    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    
    // Settings
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.PRICING_MANAGE,
    PERMISSIONS.CALENDAR_MANAGE,
    
    // Communication
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_DELETE,
    
    // System
    PERMISSIONS.SYSTEM_LOGS
  ],
  
  [ROLES.MANAGER]: [
    // User Management (read only)
    PERMISSIONS.USER_READ,
    
    // Property Management
    PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE,
    
    // Reservation Management
    PERMISSIONS.RESERVATION_CREATE,
    PERMISSIONS.RESERVATION_READ,
    PERMISSIONS.RESERVATION_UPDATE,
    PERMISSIONS.RESERVATION_CHECKIN,
    PERMISSIONS.RESERVATION_CHECKOUT,
    PERMISSIONS.RESERVATION_CANCEL,
    
    // Financial Management (limited)
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.FINANCIAL_CREATE,
    PERMISSIONS.REVENUE_MANAGE,
    PERMISSIONS.INVOICE_GENERATE,
    
    // Inventory Management
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.STOCK_IN,
    PERMISSIONS.STOCK_OUT,
    PERMISSIONS.STOCK_ADJUST,
    
    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    
    // Settings (view only)
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.PRICING_MANAGE,
    PERMISSIONS.CALENDAR_MANAGE,
    
    // Communication
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ
  ],
  
  [ROLES.FRONT_DESK]: [
    // Reservation Management
    PERMISSIONS.RESERVATION_CREATE,
    PERMISSIONS.RESERVATION_READ,
    PERMISSIONS.RESERVATION_UPDATE,
    PERMISSIONS.RESERVATION_CHECKIN,
    PERMISSIONS.RESERVATION_CHECKOUT,
    
    // Property Management (read only)
    PERMISSIONS.PROPERTY_READ,
    
    // Financial (limited)
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.INVOICE_GENERATE,
    
    // Inventory (read only)
    PERMISSIONS.INVENTORY_READ,
    
    // Communication
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    
    // Settings (view only)
    PERMISSIONS.SETTINGS_VIEW
  ],
  
  [ROLES.HOUSEKEEPING]: [
    // Reservation (read only for cleaning schedule)
    PERMISSIONS.RESERVATION_READ,
    
    // Property (read only)
    PERMISSIONS.PROPERTY_READ,
    
    // Inventory Management (housekeeping items)
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.STOCK_OUT,
    
    // Communication
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ
  ],
  
  [ROLES.MAINTENANCE]: [
    // Property Management
    PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE,
    
    // Inventory Management (maintenance items)
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.STOCK_OUT,
    
    // Communication
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ
  ],
  
  [ROLES.FINANCE]: [
    // Financial Management (full access)
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.FINANCIAL_CREATE,
    PERMISSIONS.FINANCIAL_UPDATE,
    PERMISSIONS.FINANCIAL_DELETE,
    PERMISSIONS.EXPENSE_APPROVE,
    PERMISSIONS.REVENUE_MANAGE,
    PERMISSIONS.INVOICE_GENERATE,
    PERMISSIONS.PAYMENT_PROCESS,
    
    // Reservation (read for financial data)
    PERMISSIONS.RESERVATION_READ,
    
    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    
    // Communication
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ
  ]
};

// Helper functions
const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

const canAccessResource = (userRole, resource, action) => {
  const permission = `${resource}:${action}`;
  return hasPermission(userRole, permission);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessResource
};
