'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Package, ShoppingCart, Inbox, Users, Shield,
    Building2, Tags, ClipboardList, Settings, Store, LogOut,
    ChevronLeft, ChevronRight, Menu, X, Bell, User, FolderTree, Ticket, Stethoscope,
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Nav Config ──────────────────────────────────────────────────────────────

const NAV_GROUPS = [
    {
        label: 'Overview',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        ],
    },
    {
        label: 'Catalog',
        items: [
            { href: '/admin/products', label: 'Products', icon: Package },
            { href: '/admin/categories', label: 'Categories', icon: FolderTree },
            { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
            { href: '/admin/brands', label: 'Brands', icon: Tags },
        ],
    },
    {
        label: 'Sales',
        items: [
            { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
            { href: '/admin/payments', label: 'Payments', icon: Wallet },
            { href: '/admin/order-requests', label: 'Order Requests', icon: Inbox },
            { href: '/admin/promotions', label: 'Promotions', icon: Tags },
            { href: '/admin/discounts', label: 'Discounts', icon: Ticket },
        ],
    },
    {
        label: 'Healthcare',
        items: [
            { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
        ],
    },
    {
        label: 'People',
        items: [
            { href: '/admin/users', label: 'Users', icon: Users },
            { href: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
        ],
    },
    {
        label: 'System',
        items: [
            { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
            { href: '/admin/settings', label: 'Settings', icon: Settings },
        ],
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
    href, label, icon: Icon, exact = false, collapsed, onClick,
}: {
    href: string; label: string; icon: React.ElementType;
    exact?: boolean; collapsed: boolean; onClick?: () => void;
}) {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link href={href} onClick={onClick}>
            <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                    isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
            >
                <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5')} style={{ width: 18, height: 18 }} />
                {!collapsed && <span className="truncate">{label}</span>}

                {/* Tooltip when collapsed */}
                {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg
                          opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
                          shadow-lg transition-opacity duration-150 border border-slate-700">
                        {label}
                    </div>
                )}

                {/* Active indicator */}
                {isActive && !collapsed && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/70"
                    />
                )}
            </motion.div>
        </Link>
    );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({
    collapsed, onNavClick,
}: {
    collapsed: boolean; onNavClick?: () => void;
}) {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={cn(
                'flex items-center gap-3 px-4 py-5 border-b border-slate-800',
                collapsed ? 'justify-center' : ''
            )}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/30">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-white font-bold text-base leading-tight">Weththasinghe</p>
                        <p className="text-emerald-400 text-[10px] font-medium uppercase tracking-widest">Distributors</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                {NAV_GROUPS.map(group => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-2">
                                {group.label}
                            </p>
                        )}
                        {collapsed && <div className="h-px bg-slate-800 mb-2 mx-1" />}
                        <div className="space-y-0.5">
                            {group.items.map(item => (
                                <NavItem
                                    key={item.href}
                                    {...item}
                                    collapsed={collapsed}
                                    onClick={onNavClick}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* View Store */}
            <div className={cn('px-3 pb-2', collapsed ? 'flex justify-center' : '')}>
                <Link href="/" className={cn('w-full', collapsed ? 'flex justify-center' : '')}>
                    <div className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium group relative',
                        collapsed ? 'justify-center' : ''
                    )}>
                        <Store style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                        {!collapsed && <span>View Store</span>}
                        {collapsed && (
                            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg
                              opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
                              shadow-lg transition-opacity border border-slate-700">
                                View Store
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            {/* User Profile Footer */}
            <div className="border-t border-slate-800 p-3">
                <div className={cn(
                    'flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group',
                    collapsed ? 'justify-center' : ''
                )}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                            {user?.firstName ? getInitials(user.firstName + ' ' + (user.lastName || '')) : 'A'}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-slate-500 text-[10px] truncate capitalize">
                                {user?.role?.name?.replace('_', ' ') || 'Admin'}
                            </p>
                        </div>
                    )}
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="w-7 h-7 text-slate-500 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
                {collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="w-full mt-1 h-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

function MobileTopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
    const { user } = useAuthStore();
    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 h-14 flex items-center px-4 gap-3">
            <Button
                variant="ghost"
                size="icon"
                onClick={onMenuOpen}
                className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
                <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Weththasinghe</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-800 hover:text-white relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                </Button>
                <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                        {user?.firstName ? getInitials(user.firstName) : 'A'}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const sidebarWidth = collapsed ? 'w-[68px]' : 'w-64';

    return (
        <>
            {/* Mobile Top Bar */}
            <MobileTopBar onMenuOpen={() => setMobileOpen(true)} />

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-2xl"
                        >
                            <div className="absolute top-3 right-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMobileOpen(false)}
                                    className="text-slate-400 hover:bg-slate-800 hover:text-white w-8 h-8"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 68 : 256 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                    'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 shadow-xl overflow-hidden',
                    sidebarWidth
                )}
            >
                <SidebarContent collapsed={collapsed} />

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(v => !v)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600
                     flex items-center justify-center text-slate-300 hover:bg-emerald-600 hover:text-white
                     hover:border-emerald-500 transition-all shadow-md z-10"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed
                        ? <ChevronRight className="w-3 h-3" />
                        : <ChevronLeft className="w-3 h-3" />
                    }
                </button>
            </motion.aside>

            {/* Spacer so content doesn't go under sidebar */}
            <motion.div
                animate={{ width: collapsed ? 68 : 256 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="hidden lg:block flex-shrink-0"
            />
        </>
    );
}
