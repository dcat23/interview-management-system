import { COMMON_NAV, DASHBOARD, type NavItem, type Role } from "@feature/base/server";

/**
 * [dashboard-nav]
 * next-feature@0.1.4-2
 * July 30th 2026, 10:14:46 pm
 */
export const DASHBOARD_NAV: Record<Role, NavItem[]> = {
    candidate: [
        DASHBOARD,
        { name: 'My Processes', href: '/candidate/processes', icon: 'briefcase' },
    ],
    marketer: [
        ...COMMON_NAV
    ],
    supporter: [
        ...COMMON_NAV
    ],
    admin: [
        ...COMMON_NAV
    ],
} as const;