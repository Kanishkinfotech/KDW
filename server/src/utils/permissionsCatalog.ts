import { prisma } from '../database/db';

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
  'manager',
  'inventory_manager',
  'support_agent',
  'marketing'
] as const;

export type StaffRole = typeof STAFF_ROLES[number];

export const ROLE_LABEL_MAP: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  inventory_manager: 'Inventory Manager',
  support_agent: 'Support Agent',
  marketing: 'Marketing'
};

export const normalizeRole = (role?: string): string => {
  if (!role) return 'customer';
  const normalized = role.toLowerCase().replace(/[\s-]+/g, '_');
  // Handle alias formats
  if (normalized === 'superadmin') return 'super_admin';
  if (normalized === 'inventory') return 'inventory_manager';
  if (normalized === 'store_manager') return 'manager';
  if (normalized === 'support') return 'support_agent';
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
  manager: [
    'products.read',
    'products.write',
    'inventory.write',
    'orders.read',
    'orders.write',
    'payments.read',
    'customers.read',
    'customers.write',
    'coupons.write',
    'reviews.moderate',
    'support.tickets.write',
    'analytics.read'
  ],
  inventory_manager: [
    'products.read',
    'products.write',
    'inventory.write',
    'orders.read'
  ],
  support_agent: [
    'support.tickets.write',
    'orders.read',
    'customers.read',
    'reviews.moderate'
  ],
  marketing: [
    'coupons.write',
    'products.read',
    'analytics.read',
    'reviews.moderate'
  ],
  customer: []
};

// In-memory cache for dynamic role defaults loaded from DB
let cachedRoleDefaults: Record<string, string[]> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

/**
 * Reads dynamic role defaults from PostgreSQL Role table with caching
 */
export const getDynamicRoleDefaults = async (client: any = prisma): Promise<Record<string, string[]>> => {
  const now = Date.now();
  if (cachedRoleDefaults && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedRoleDefaults;
  }

  try {
    const rolesFromDb = await client.role.findMany();
    const dynamicDefaults: Record<string, string[]> = { ...ROLE_DEFAULT_PERMISSIONS };

    for (const roleKey of STAFF_ROLES) {
      const dbRoleName = ROLE_LABEL_MAP[roleKey] || roleKey;
      const matchingRole = rolesFromDb.find(
        (r: any) =>
          r.name.toLowerCase() === dbRoleName.toLowerCase() ||
          normalizeRole(r.name) === roleKey
      );

      if (matchingRole) {
        if (roleKey === 'super_admin' || matchingRole.permissions === 'ALL') {
          dynamicDefaults[roleKey] = [...ALL_PERMISSION_CODES];
        } else {
          try {
            const parsed = JSON.parse(matchingRole.permissions);
            if (Array.isArray(parsed)) {
              const validCodes = parsed.filter((c: string) => ALL_PERMISSION_CODES.includes(c));
              if (validCodes.length > 0) {
                dynamicDefaults[roleKey] = validCodes;
              } else if (ROLE_DEFAULT_PERMISSIONS[roleKey]) {
                dynamicDefaults[roleKey] = [...ROLE_DEFAULT_PERMISSIONS[roleKey]];
              }
            }
          } catch {
            // Keep default if parsing fails
          }
        }
      }
    }

    cachedRoleDefaults = dynamicDefaults;
    lastCacheTime = now;
    return dynamicDefaults;
  } catch (err) {
    console.warn('Could not read dynamic role defaults from DB, using fallback defaults:', err);
    return { ...ROLE_DEFAULT_PERMISSIONS };
  }
};

/**
 * Saves dynamic role defaults to PostgreSQL Role table and invalidates cache
 */
export const saveDynamicRoleDefaults = async (
  newDefaults: Record<string, string[]>,
  client: any = prisma
): Promise<Record<string, string[]>> => {
  const sanitized: Record<string, string[]> = {
    ...ROLE_DEFAULT_PERMISSIONS,
    super_admin: [...ALL_PERMISSION_CODES]
  };

  for (const [roleKey, perms] of Object.entries(newDefaults)) {
    const norm = normalizeRole(roleKey);
    if (norm === 'super_admin') continue;
    if (Array.isArray(perms)) {
      sanitized[norm] = Array.from(new Set(perms.filter(c => ALL_PERMISSION_CODES.includes(c))));
    }
  }

  for (const roleKey of STAFF_ROLES) {
    const roleName = ROLE_LABEL_MAP[roleKey] || roleKey;
    const permissionsPayload = roleKey === 'super_admin' ? 'ALL' : JSON.stringify(sanitized[roleKey] || []);

    try {
      await client.role.upsert({
        where: { name: roleName },
        update: {
          permissions: permissionsPayload,
          updatedAt: new Date()
        },
        create: {
          name: roleName,
          description: `${roleName} default permissions`,
          permissions: permissionsPayload,
          isSystem: roleKey === 'super_admin' || roleKey === 'admin'
        }
      });
    } catch (upsertErr) {
      console.error(`Failed to upsert role default for ${roleName}:`, upsertErr);
    }
  }

  cachedRoleDefaults = sanitized;
  lastCacheTime = Date.now();
  return sanitized;
};

/**
 * Validates whether a permission code exists in the catalog (supports '-' prefix for revocations)
 */
export const isValidPermissionCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  const cleanCode = code.startsWith('-') ? code.slice(1) : code;
  return ALL_PERMISSION_CODES.includes(cleanCode);
};

/**
 * Calculates effective permissions: Role Defaults minus Revocations plus Extra User Grants
 */
export const effectivePermissions = (
  user: { role?: string; permissions?: string[] | null },
  dynamicDefaults?: Record<string, string[]>
): string[] => {
  const normRole = normalizeRole(user.role);
  const defaults = (dynamicDefaults && dynamicDefaults[normRole]) ||
    (cachedRoleDefaults && cachedRoleDefaults[normRole]) ||
    ROLE_DEFAULT_PERMISSIONS[normRole] || [];

  const userPerms = Array.isArray(user.permissions) ? user.permissions : [];

  const revokes = new Set(
    userPerms.filter(p => p.startsWith('-')).map(p => p.slice(1))
  );
  const grants = new Set(
    userPerms.filter(p => !p.startsWith('-'))
  );

  const effective = new Set<string>();
  for (const p of defaults) {
    if (!revokes.has(p)) {
      effective.add(p);
    }
  }
  for (const g of grants) {
    if (ALL_PERMISSION_CODES.includes(g)) {
      effective.add(g);
    }
  }

  return Array.from(effective);
};
