export const ADMIN_ALLOWED_ROLES = [
  'admin',
  'super_admin',
  'superadmin',
  'super admin',
  'manager',
  'inventory_manager',
  'inventory manager',
  'order_manager',
  'order manager',
  'finance',
  'finance_manager',
  'finance manager',
  'marketing',
  'support',
  'support_agent',
  'support agent',
  'custom',
  'staff',
  'store_manager',
  'store manager',
  'catalog_manager',
  'review_moderator',
  'content_editor',
  'developer/ops'
];

export function hasAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const raw = String(role).trim().toLowerCase();
  const normalizedSpaces = raw.replace(/[-_]+/g, ' ');
  const normalizedUnderscores = raw.replace(/[-\s]+/g, '_');

  return ADMIN_ALLOWED_ROLES.some(r => {
    const target = r.toLowerCase();
    return (
      target === raw ||
      target === normalizedSpaces ||
      target === normalizedUnderscores ||
      target.replace(/[-_]+/g, ' ') === normalizedSpaces
    );
  });
}
