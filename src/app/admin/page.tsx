'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Truck,
  Eye,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store';
import { adminApi, type OrderStats } from '@/lib/api/admin';
import type { Order, Product } from '@/types';
import { toast } from 'sonner';

const ORDER_STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  processing: { color: 'bg-indigo-100 text-indigo-700', icon: RefreshCw },
  shipped: { color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { color: 'bg-emerald-100 text-emerald-700', icon: Package },
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, doctorsRes, lowStockRes] = await Promise.all([
        adminApi.getOrderStats().catch(() => null),
        adminApi.getOrders({ limit: 5 }),
        adminApi.getProducts({ limit: 1 }),
        adminApi.getDoctors({ limit: 1 }),
        adminApi.getLowStockProducts().catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      setRecentOrders(ordersRes.data);
      setProductCount(productsRes.pagination.total);
      setDoctorCount(doctorsRes.pagination.total);
      setLowStockProducts(lowStockRes.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats?.totalRevenue ? `Rs.${parseFloat(stats.totalRevenue).toLocaleString()}` : 'Rs.0',
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'blue',
    },
    {
      title: 'Products',
      value: productCount.toString(),
      change: '+3.2%',
      trend: 'up',
      icon: Package,
      color: 'violet',
    },
    {
      title: 'Registered Doctors',
      value: doctorCount.toString(),
      change: '+8.4%',
      trend: 'up',
      icon: Users,
      color: 'orange',
    },
  ];

  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.firstName || 'Admin'}!</h1>
          <p className="text-slate-500">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.firstName || 'Admin'}!
          </h1>
          <p className="text-slate-500">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Order Status Breakdown */}
      {stats?.statusBreakdown && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.statusBreakdown).slice(0, 5).map(([status, count]) => {
            const config = ORDER_STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-700', icon: Clock };
            const Icon = config.icon;
            return (
              <Card key={status} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-slate-500 capitalize">{status}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Recent Orders
              </CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                View All <Eye className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusConfig = ORDER_STATUS_CONFIG[order.status] || { color: 'bg-gray-100 text-gray-700' };
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-slate-900">{order.orderNumber}</p>
                          <p className="text-sm text-slate-500">{order.itemCount} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">Rs.{parseFloat(order.total).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig.color}>{order.status}</Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>Products running low</CardDescription>
            </div>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm">
                View All <Eye className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p>All products stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 rounded bg-orange-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.sku}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-500">
                      {product.stockQuantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/products">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Package className="w-6 h-6" />
                <span>Add Product</span>
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <ShoppingCart className="w-6 h-6" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link href="/admin/promotions">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <TrendingUp className="w-6 h-6" />
                <span>Create Promotion</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                <span>Manage Users</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
