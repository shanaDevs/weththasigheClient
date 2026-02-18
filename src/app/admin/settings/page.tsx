'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Bell,
  Shield,
  Palette,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  CreditCard,
  Truck,
  Package,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin';
import type { SystemSetting } from '@/types';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allSettings, setAllSettings] = useState<SystemSetting[]>([]);

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    site_name: 'MediPharm B2B',
    storeEmail: 'contact@medipharm.lk',
    storePhone: '+94 11 234 5678',
    storeAddress: '123 Galle Road, Colombo 03',
    city: 'Colombo',
    state: 'Western Province',
    postalCode: '00300',
    country: 'Sri Lanka',
    currency_symbol: 'LKR',
    timezone: 'Asia/Colombo',
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderConfirmation: true,
    orderShipped: true,
    orderDelivered: true,
    lowStockAlert: true,
    newUserRegistration: true,
    dailyReport: false,
    weeklyReport: true,
  });

  // Business settings state
  const [businessSettings, setBusinessSettings] = useState({
    min_order_value: '500',
    free_shipping_threshold: '5000',
    default_shipping_charge: '100',
    taxRate: '18',
    defaultCreditLimit: '50000',
    allowCOD: true,
    allowCredit: true,
    requirePrescription: true,
    autoConfirmOrders: false,
    delivery_ranges: [] as { min: number; max: number; fee: number }[],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { settings } = await adminApi.getSettings();
      setAllSettings(settings);

      // Map settings to state
      const settingsMap = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, any>);

      setStoreSettings(prev => ({
        ...prev,
        site_name: settingsMap.site_name || prev.site_name,
        currency_symbol: settingsMap.currency_symbol || prev.currency_symbol,
      }));

      setBusinessSettings(prev => ({
        ...prev,
        min_order_value: settingsMap.min_order_value || prev.min_order_value,
        free_shipping_threshold: settingsMap.free_shipping_threshold || prev.free_shipping_threshold,
        default_shipping_charge: settingsMap.default_shipping_charge || prev.default_shipping_charge,
        delivery_ranges: settingsMap.delivery_ranges || prev.delivery_ranges,
      }));

    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsToSave: Record<string, any>) => {
    setSaving(true);
    try {
      const payload = Object.entries(settingsToSave).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      await adminApi.bulkUpdateSettings(payload);
      toast.success('Settings saved successfully');
      await fetchSettings();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStoreSettings = () => {
    saveSettings({
      site_name: storeSettings.site_name,
      currency_symbol: storeSettings.currency_symbol,
    });
  };

  const handleSaveBusinessSettings = () => {
    saveSettings({
      min_order_value: businessSettings.min_order_value,
      free_shipping_threshold: businessSettings.free_shipping_threshold,
      default_shipping_charge: businessSettings.default_shipping_charge,
      delivery_ranges: businessSettings.delivery_ranges,
    });
  };

  const handleSaveNotificationSettings = async () => {
    toast.info('Notification settings save not implemented in backend yet');
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your store configuration and preferences</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Information
              </CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeSettings.site_name}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, site_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="storeEmail"
                      type="email"
                      className="pl-10"
                      value={storeSettings.storeEmail}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, storeEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="storePhone"
                      className="pl-10"
                      value={storeSettings.storePhone}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, storePhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={storeSettings.currency_symbol}
                    onValueChange={(v) => setStoreSettings(prev => ({ ...prev, currency_symbol: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LKR">Rs. LKR - Sri Lankan Rupee</SelectItem>
                      <SelectItem value="INR">Rs. INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="storeAddress">Street Address</Label>
                    <Textarea
                      id="storeAddress"
                      rows={2}
                      value={storeSettings.storeAddress}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, storeAddress: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={storeSettings.city}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={storeSettings.state}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={storeSettings.postalCode}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={storeSettings.timezone}
                      onValueChange={(v) => setStoreSettings(prev => ({ ...prev, timezone: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Colombo">Asia/Colombo (SLST)</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveStoreSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure email and alert notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Order Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Order Confirmation</p>
                      <p className="text-xs text-slate-500">When a new order is placed</p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderConfirmation}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, orderConfirmation: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Order Shipped</p>
                      <p className="text-xs text-slate-500">When an order is shipped</p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderShipped}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, orderShipped: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Order Delivered</p>
                      <p className="text-xs text-slate-500">When an order is delivered</p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderDelivered}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, orderDelivered: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">System Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Low Stock Alert</p>
                      <p className="text-xs text-slate-500">When products are running low</p>
                    </div>
                    <Switch
                      checked={notificationSettings.lowStockAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, lowStockAlert: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New User Registration</p>
                      <p className="text-xs text-slate-500">When a new doctor registers</p>
                    </div>
                    <Switch
                      checked={notificationSettings.newUserRegistration}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newUserRegistration: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Reports</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Daily Report</p>
                      <p className="text-xs text-slate-500">Receive daily sales summary</p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyReport}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, dailyReport: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Weekly Report</p>
                      <p className="text-xs text-slate-500">Receive weekly analytics report</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReport: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Business Settings
              </CardTitle>
              <CardDescription>
                Configure pricing, shipping, and payment options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">Minimum Order Amount (Rs.)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={businessSettings.min_order_value}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, min_order_value: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={businessSettings.taxRate}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Shipping
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (Rs.)</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      value={businessSettings.free_shipping_threshold}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, free_shipping_threshold: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">Orders above this amount get free shipping</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultShippingCharge">Default Shipping Charge (Rs.)</Label>
                    <Input
                      id="defaultShippingCharge"
                      type="number"
                      value={businessSettings.default_shipping_charge}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, default_shipping_charge: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">Shipping fee for orders below threshold</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Delivery Charge Ranges
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-500 hover:bg-emerald-50"
                    onClick={() => {
                      setBusinessSettings(prev => ({
                        ...prev,
                        delivery_ranges: [...prev.delivery_ranges, { min: 0, max: 0, fee: 0 }]
                      }));
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Range
                  </Button>
                </h4>
                <div className="space-y-3">
                  {businessSettings.delivery_ranges.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">No custom delivery ranges defined.</p>
                      <p className="text-xs text-slate-400 mt-1">Default shipping charge will apply to all orders below threshold.</p>
                    </div>
                  ) : (
                    businessSettings.delivery_ranges.map((range, index) => (
                      <div key={index} className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Min Amount (Rs.)</Label>
                          <Input
                            type="number"
                            value={range.min}
                            onChange={(e) => {
                              const newRanges = [...businessSettings.delivery_ranges];
                              newRanges[index].min = parseFloat(e.target.value) || 0;
                              setBusinessSettings(prev => ({ ...prev, delivery_ranges: newRanges }));
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Max Amount (Rs.)</Label>
                          <Input
                            type="number"
                            value={range.max}
                            onChange={(e) => {
                              const newRanges = [...businessSettings.delivery_ranges];
                              newRanges[index].max = parseFloat(e.target.value) || 0;
                              setBusinessSettings(prev => ({ ...prev, delivery_ranges: newRanges }));
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Fee (Rs.)</Label>
                          <Input
                            type="number"
                            value={range.fee}
                            onChange={(e) => {
                              const newRanges = [...businessSettings.delivery_ranges];
                              newRanges[index].fee = parseFloat(e.target.value) || 0;
                              setBusinessSettings(prev => ({ ...prev, delivery_ranges: newRanges }));
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const newRanges = businessSettings.delivery_ranges.filter((_, i) => i !== index);
                            setBusinessSettings(prev => ({ ...prev, delivery_ranges: newRanges }));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-slate-500 italic">
                    Note: If an order amount falls within a range, that fee will apply instead of the default charge.
                  </p>
                </div>
              </div>

              <Separator />


              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment & Credit
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCreditLimit">Default Credit Limit (Rs.)</Label>
                    <Input
                      id="defaultCreditLimit"
                      type="number"
                      value={businessSettings.defaultCreditLimit}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, defaultCreditLimit: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Allow Cash on Delivery</p>
                      <p className="text-xs text-slate-500">Enable COD payment option</p>
                    </div>
                    <Switch
                      checked={businessSettings.allowCOD}
                      onCheckedChange={(checked) => setBusinessSettings(prev => ({ ...prev, allowCOD: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Allow Credit Purchases</p>
                      <p className="text-xs text-slate-500">Enable buying on credit for verified doctors</p>
                    </div>
                    <Switch
                      checked={businessSettings.allowCredit}
                      onCheckedChange={(checked) => setBusinessSettings(prev => ({ ...prev, allowCredit: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Product Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require Prescription</p>
                      <p className="text-xs text-slate-500">Enforce prescription requirements</p>
                    </div>
                    <Switch
                      checked={businessSettings.requirePrescription}
                      onCheckedChange={(checked) => setBusinessSettings(prev => ({ ...prev, requirePrescription: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-confirm Orders</p>
                      <p className="text-xs text-slate-500">Automatically confirm orders after payment</p>
                    </div>
                    <Switch
                      checked={businessSettings.autoConfirmOrders}
                      onCheckedChange={(checked) => setBusinessSettings(prev => ({ ...prev, autoConfirmOrders: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBusinessSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage account security and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Change Password</h4>
                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button onClick={() => toast.success('Password updated successfully')}>
                    Update Password
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">2FA is not enabled</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info('2FA setup coming soon')}>
                    Enable 2FA
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Active Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-slate-500">Windows • Chrome • Mumbai, India</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
