'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Inbox,
  Tags,
  Settings,
  Store,
  Bell,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/order-requests', label: 'Order Requests', icon: Inbox },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/promotions', label: 'Promotions', icon: Tags },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white border-b border-slate-800">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-slate-900 border-slate-800 p-0 flex flex-col">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation Menu</SheetTitle>
                  <SheetDescription>
                    Access different sections of the admin panel including dashboard, products, and orders.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-4 border-b border-slate-800">
                  <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">Admin Panel</span>
                  </Link>
                </div>
                <nav className="p-4 space-y-1">
                  {adminNavLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block text-lg font-bold">Admin Panel</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <motion.span
                    whileHover={{ y: -1 }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Switch to Store Button */}
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              >
                <Store className="w-4 h-4" />
                View Store
              </Button>
            </Link>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-800 hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-emerald-600 text-white text-sm">
                      {user?.firstName ? getInitials(user.firstName) : 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.firstName || 'Admin'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-500">{user?.role?.name || 'Admin'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <Store className="w-4 h-4" />
                    View Store
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
