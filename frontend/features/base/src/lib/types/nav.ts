import { Role } from "./user";
import { type IconName } from "lucide-react/dynamic"

/**
 * [nav-item]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:09:14 am
 */
export interface NavItem {
    name: string
    href: string
    icon: IconName
}

export const DASHBOARD: NavItem = { 
    name: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' 
}
/**
 * [role-nav-items]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:10:39 am
 */
const supporter: NavItem[] = [
    { name: 'Sessions', href: '/supporter/sessions', icon: 'calendar-check' },
    { name: 'Processes', href: '/supporter/processes', icon: 'briefcase' },
    { name: 'Clients', href: '/supporter/clients', icon: 'building-2' },
    { name: 'Questions', href: '/supporter/questions', icon: 'book-open' },
] as const;

export const ROLE_NAV: Record<Role, NavItem[]> = {
    candidate: [
        { name: 'My Processes', href: '/candidate/processes', icon: 'briefcase' },
    ],
    marketer: [
        { name: 'Processes', href: '/marketer/processes', icon: 'briefcase' },
        { name: 'New Process', href: '/marketer/processes/new', icon: 'plus' },
    ],
    supporter,
    admin: [
        { name: 'Processes', href: '/admin/processes', icon: 'briefcase' },
        { name: 'Question Bank', href: '/admin/questions', icon: 'book-open' },
    ],
} as const;
