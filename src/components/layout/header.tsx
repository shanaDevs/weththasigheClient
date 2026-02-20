'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  Stethoscope,
  ChevronDown,
  LayoutDashboard,
  Wallet,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useCartStore } from '@/store';
import { cn, debounce } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/brands', label: 'Brands' },
  { href: '/promotions', label: 'Offers' },
];

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { settings } = useSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchCart();
    }
  }, [_hasHydrated, isAuthenticated, fetchCart]);

  // Use mounted state to avoid hydration mismatch
  const showAuthContent = isMounted && _hasHydrated;

  const handleSearch = debounce((query: string) => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
    }
  }, 300);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const itemCount = cart?.itemCount || 0;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50'
          : 'bg-white border-b border-slate-100'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent block">
                  {settings?.site_name || 'MediPharm'}
                </span>
                <span className="text-[10px] text-slate-500 block -mt-1">
                  {settings?.site_tagline || 'B2B Healthcare'}
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.span
                  whileHover={{ y: -2 }}
                  className="px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors rounded-lg hover:bg-emerald-50"
                >
                  {link.label}
                </motion.span>
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search medicines, healthcare products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(searchQuery);
                  }
                }}
                className="w-full pl-10 pr-4 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative group">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <ShoppingCart className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </motion.div>
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-emerald-500 hover:bg-emerald-500 text-[10px] font-bold">
                        {itemCount > 99 ? '99+' : itemCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </Link>

            {/* User Menu */}
            {showAuthContent && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-11">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-slate-700">
                      {user?.firstName}
                    </span>
                    <ChevronDown className="hidden lg:block w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{user?.phone}</p>
                  </div>
                  {['admin', 'super_admin', 'manager'].includes(user?.role?.name?.toLowerCase() || '') && user?.authenticatedBy === 'phone' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer text-emerald-600">
                          <LayoutDashboard className="mr-2 w-4 h-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center cursor-pointer">
                      <Package className="mr-2 w-4 h-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/order-requests" className="flex items-center cursor-pointer">
                      <FileText className="mr-2 w-4 h-4 text-emerald-600" />
                      My Order Requests
                    </Link>
                  </DropdownMenuItem>
                  {user?.role?.name?.toLowerCase() === 'doctor' && (
                    <DropdownMenuItem asChild>
                      <Link href="/doctor/payments" className="flex items-center cursor-pointer">
                        <Wallet className="mr-2 w-4 h-4 text-emerald-600" />
                        Payments & Credit
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>

                    <Link href="/addresses" className="flex items-center cursor-pointer">
                      <MapPin className="mr-2 w-4 h-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 flex flex-col">
                <SheetHeader className="sr-only">
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                  <SheetDescription>
                    Access different sections of the store including products, categories, and your account.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <span className="text-lg font-semibold">Menu</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <nav className="flex flex-col space-y-1 py-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-3 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  {showAuthContent && !isAuthenticated && (
                    <div className="mt-auto pb-4 space-y-2">
                      <Link href="/login" className="block">
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" className="block">
                        <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden pb-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 rounded-xl"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
