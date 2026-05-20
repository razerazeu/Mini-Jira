import { UserRole } from '../enums';
// instead of looking for MANAGER and manager I just made them all capital
export function normalizeRole(role?: string | UserRole | null) {
  return typeof role === 'string' ? role.toUpperCase() : role;
}

export function isManager(user: { role?: string | UserRole | null } | null | undefined) {
  return normalizeRole(user?.role) === UserRole.MANAGER;
}
