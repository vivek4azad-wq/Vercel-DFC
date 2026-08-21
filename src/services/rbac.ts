/**
 * Role-Based Access Control (RBAC) Service & Permissions Matrix
 * DFCCIL IMSD SMUN Unit
 * 
 * Rules:
 * 1. SUPER_ADMIN (Shri Vivek Kumar Azad, APM/Civil): Full master read/write/delete/admin across all modules, approval of deletions, and historical attendance.
 * 2. OFFICER (Executive / Arjun):
 *    - P.Way Maintenance & Track Defects: Full CREATE & UPDATE permission (can edit, add, rectify).
 *    - Assets (Bridges, Points, Curves, LWR, SEJ): Read-Only (no edits in assets).
 *    - DELETION: CANNOT delete directly. Deletion requests go to APM (Shri Vivek Kumar Azad) for approval.
 * 3. STAFF / MTS: Can only do data entry for Today's 1+15 Gang Daily Work Progress. Read-only on assets.
 */

import type { UserRole, UserSession } from '../types/index.ts';

export type RbacAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'ADMIN_PANEL'
  | 'GENERATE_PIN'
  | 'GENERATE_QR';

export class RBACService {
  /**
   * Evaluates whether a role can perform an action on a target resource.
   */
  static canPerform(
    role: UserRole | string | null | undefined,
    action: RbacAction,
    resource: string
  ): boolean {
    if (!role || !action || !resource) return false;

    // 1. SUPER_ADMIN has unrestricted permissions across all resources and actions
    if (role === 'SUPER_ADMIN' || role === 'Admin' || role === 'APM') {
      return true;
    }

    // 2. GUEST Role: Unrestricted READ access across ALL portal data, no mutations
    if (role === 'GUEST' || role === 'Guest' || role === 'ANONYMOUS') {
      if (action === 'READ') return true;
      return false;
    }

    // 3. CLERK Role: Full READ access, and ONLY Attendance modifications allowed
    if (role === 'CLERK' || role === 'Clerk') {
      if (action === 'READ') return true;
      if ((action === 'CREATE' || action === 'UPDATE') && (resource === 'attendance' || resource === 'staff_attendance')) {
        return true;
      }
      return false;
    }

    // 4. STORE_KEEPER: Store Inventory & Transactions
    if (role === 'STORE_KEEPER' || role === 'StoreKeeper') {
      if (action === 'READ') return true;
      if ((action === 'CREATE' || action === 'UPDATE') && (resource === 'store' || resource === 'store_inventory' || resource === 'store_transactions')) {
        return true;
      }
      return false;
    }

    // 5. OFFICER (Executive / Sectional) Permissions:
    // - P.Way Maintenance & Track Defects: Allowed to CREATE and UPDATE
    // - Assets (Bridges, Points, Curves, LWR, SEJ): Read-Only
    // - DELETE: Blocked (requires Super Admin APM approval)
    if (role === 'OFFICER' || role === 'Sectional' || role === 'Executive') {
      if (action === 'READ') return true;
      if (action === 'GENERATE_QR') return true;

      if (action === 'CREATE' || action === 'UPDATE') {
        const allowedMutationResources = [
          'track_defects',
          'pway_daily_progress',
          'pway_monthly_program',
          'pway_inspections',
          'attendance',
          'staff_attendance'
        ];
        return allowedMutationResources.includes(resource);
      }

      return false;
    }

    // 6. STAFF (MTS) Permissions: Gang Working Data Entry Only, Read-Only for Assets
    if (role === 'STAFF' || role === 'MTS') {
      if (action === 'READ') {
        return true;
      }

      if ((action === 'CREATE' || action === 'UPDATE') && resource === 'pway_daily_progress') {
        return true;
      }

      if (action === 'GENERATE_QR' && resource === 'self') {
        return true;
      }

      return false;
    }

    return action === 'READ';
  }

  static canAccessAdminPanel(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }

  static canCreateOrEditDefect(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICER';
  }

  static canCreateOrEditPWay(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICER' || user?.role === 'STAFF';
  }

  static canDeleteDirectly(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }

  static canManageUsers(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }
}
