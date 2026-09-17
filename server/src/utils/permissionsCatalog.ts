export interface PermissionDefinition {
  code: string;
  resource: string;
  action: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
}

export const STAFF_ROLES = [
  'super_admin',
  'admin',
  'inventory_manager'
] as const;

export type StaffRole = typeof STAFF_ROLES[number];

export const normalizeRole = (role?: string): string => {
  if (!role) return 'customer';
  const normalized = role.toLowerCase().replace(/[\s-]+/g, '_');
  // Handle alias formats (e.g. superadmin -> super_admin, inventory -> inventory_manager)
  if (normalized === 'superadmin') return 'super_admin';
  if (normalized === 'inventory') return 'inventory_manager';
  if (normalized === 'manager' || normalized === 'store_manager') return 'admin';
  return normalized;
};

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    code: 'products.read',
    resource: 'products',
    action: 'read',
    riskLevel: 'LOW',
    description: 'View products and catalog items'
  },
  {
    code: 'products.write',
    resource: 'products',
    action: 'write',
    riskLevel: 'MEDIUM',
    description: 'Create and update products, variants, and pricing'
  },
  {
    code: 'inventory.write',
    resource: 'inventory',
    action: 'write',
    riskLevel: 'MEDIUM',
    description: 'Adjust digital stock counts and delivery links'
  },
  {
    code: 'orders.read',
    resource: 'orders',
    action: 'read',
    riskLevel: 'LOW',
    description: 'View customer orders and fulfillment states'
  },
  {
    code: 'orders.write',
    resource: 'orders',
    action: 'write',
    riskLevel: 'MEDIUM',
    description: 'Update order status and handle cancellations'
  },
  {
    code: 'payments.read',
    resource: 'payments',
    action: 'read',
    riskLevel: 'MEDIUM',
    description: 'Inspect transaction ledgers and gateway records'
  },
  {
    code: 'payments.refund',
    resource: 'payments',
    action: 'refund',
    riskLevel: 'CRITICAL',
    description: 'Issue partial or full payment refunds'
  },
  {
    code: 'customers.read',
    resource: 'customers',
    action: 'read',
    riskLevel: 'LOW',
    description: 'View customer directories and profile details'
  },
  {
    code: 'customers.write',
    resource: 'customers',
    action: 'write',
    riskLevel: 'MEDIUM',
    description: 'Edit customer records and customer tags'
  },
  {
    code: 'coupons.write',
    resource: 'coupons',
    action: 'write',
    riskLevel: 'MEDIUM',
    description: 'Create and configure coupon discount codes'
  },
  {
    code: 'reviews.moderate',
    resource: 'reviews',
    action: 'moderate',
    riskLevel: 'LOW',
    description: 'Approve, reject, and reply to customer reviews'
  },
  {
    code: 'support.tickets.write',
    resource: 'support',
    action: 'tickets.write',
    riskLevel: 'LOW',
    description: 'Reply to, triage, and resolve customer support tickets'
  },
  {
    code: 'analytics.read',
    resource: 'analytics',
    action: 'read',
    riskLevel: 'LOW',
    description: 'View sales and operational analytics dashboards'
  },
  {
    code: 'settings.update',
    resource: 'settings',
    action: 'update',
    riskLevel: 'HIGH',
    description: 'Update general store configuration and shipping policies'
  },
  {
    code: 'settings.secrets.view',
    resource: 'settings',
    action: 'secrets.view',
    riskLevel: 'CRITICAL',
    description: 'View raw API keys and payment gateway webhook secrets'
  },
  {
    code: 'users.manage',
    resource: 'users',
    action: 'manage',
    riskLevel: 'CRITICAL',
    description: 'Invite staff members and manage roles and permissions'
  },
  {
    code: 'audit.read',
    resource: 'audit',
    action: 'read',
    riskLevel: 'MEDIUM',
    description: 'Inspect administrative audit log histories'
  },
  {
    code: 'system.read',
    resource: 'system',
    action: 'read',
    riskLevel: 'MEDIUM',
    description: 'Inspect system health, diagnostics, and error traces'
  }
];

export const ALL_PERMISSION_CODES = PERMISSION_CATALOG.map(p => p.code);

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  super_admin: [...ALL_PERMISSION_CODES],
  admin: ALL_PERMISSION_CODES.filter(code => code !== 'settings.secrets.view'),
  inventory_manager: [
    'products.read',
    'products.write',
    'inventory.write',
    'orders.read'
  ],
  customer: []
};

/**
 * Validates whether a permission code exists in the catalog
 */
export const isValidPermissionCode = (code: string): boolean => {
  return ALL_PERMISSION_CODES.includes(code);
};

/**
 * Calculates effective permissions: Role Defaults + Extra User Grants (deduplicated)
 */
export const effectivePermissions = (user: { role?: string; permissions?: string[] | null }): string[] => {
  const normRole = normalizeRole(user.role);
  const defaults = ROLE_DEFAULT_PERMISSIONS[normRole] || [];
  const extras = Array.isArray(user.permissions) ? user.permissions : [];
  
  return Array.from(new Set([...defaults, ...extras]));
};
