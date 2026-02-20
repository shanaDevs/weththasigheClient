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
  Trash2,
  Hash,
  Percent,
  Database,
  TruckIcon,
  Search
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
import adminApi from '@/lib/api/admin';
import { authService } from '@/lib/api/auth';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import type { SystemSetting } from '@/types';
import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminSettingsPage() {
  const { settings: currentSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allSettings, setAllSettings] = useState<SystemSetting[]>([]);

  // Dynamic settings state grouped by category
  const [settingsByGroup, setSettingsByGroup] = useState<Record<string, SystemSetting[]>>({});

  // Local state for each category to handle edits before saving
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { user, setUser } = useAuthStore();
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  const handleToggle2FA = async () => {
    if (user?.twoFactorEnabled) {
      try {
        await authService.disable2FA();
        setUser({ ...user, twoFactorEnabled: false });
        toast.success('2FA disabled successfully');
      } catch (error) {
        toast.error('Failed to disable 2FA');
      }
    } else {
      try {
        await authService.request2FAEnable();
        setTwoFactorModalOpen(true);
        toast.info('Verification code sent to your email');
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to send verification code');
      }
    }
  };

  const confirmEnable2FA = async () => {
    if (!twoFactorCode || !user) return;
    setVerifying2FA(true);
    try {
      await authService.confirm2FAEnable(twoFactorCode);
      setUser({ ...user, twoFactorEnabled: true });
      setTwoFactorModalOpen(false);
      setTwoFactorCode('');
      toast.success('2FA enabled successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerifying2FA(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchSettings(searchTerm);
      } else {
        fetchSettings();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSettings = async (search?: string) => {
    if (search) setIsSearching(true);
    try {
      const { settings, grouped } = await adminApi.getSettings(undefined, search);
      setAllSettings(settings);
      setSettingsByGroup(grouped);

      const settingsMap = settings.reduce((acc, s) => {
        let parsedValue: any = s.value;
        const rawValue = s.value;

        try {
          if (s.dataType === 'json' || s.dataType === 'array' || (typeof rawValue === 'string' && (rawValue.startsWith('[') || rawValue.startsWith('{')))) {
            parsedValue = JSON.parse(rawValue);
          } else if (s.dataType === 'boolean') {
            parsedValue = rawValue === 'true' || rawValue === '1';
          } else if (s.dataType === 'number') {
            parsedValue = parseFloat(rawValue);
          }
        } catch (e) {
          parsedValue = rawValue;
        }

        acc[s.key] = parsedValue;
        return acc;
      }, {} as Record<string, any>);

      setLocalSettings(settingsMap);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const saveSettings = async (settingsToSave: Record<string, any>) => {
    setSaving(true);
    try {
      const payload = Object.entries(settingsToSave).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }));
      await adminApi.bulkUpdateSettings(payload);
      toast.success('Settings saved successfully');
      await fetchSettings(searchTerm);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveCategorySettings = async (category: string) => {
    const settingsInCategory = settingsByGroup[category] || [];
    const payload = settingsInCategory.map(s => ({
      key: s.key,
      value: localSettings[s.key]
    }));

    await saveSettings(payload.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>));
  };

  const renderSettingField = (s: SystemSetting) => {
    const value = localSettings[s.key] ?? s.value;
    const inputType = s.inputType || 'text';

    const isToggle = inputType === 'toggle' || s.dataType === 'boolean';
    const isJson = s.dataType === 'json' || s.dataType === 'array';

    // For JSON/Array fields, ensure the display value is stringified if it's currently an object
    const displayValue = isJson && typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '');

    if (isToggle) {
      return (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <div>
            <Label className="text-base font-semibold">{s.displayName}</Label>
            {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
          </div>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => updateLocalSetting(s.key, checked)}
          />
        </div>
      );
    }

    if (inputType === 'textarea' || isJson) {
      return (
        <div className="space-y-2">
          <Label>{s.displayName}</Label>
          <Textarea
            value={displayValue}
            onChange={(e) => updateLocalSetting(s.key, e.target.value)}
            placeholder={s.placeholder || ''}
            rows={isJson ? 6 : 3}
            className={isJson ? 'font-mono text-sm' : ''}
          />
          {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
        </div>
      );
    }

    switch (inputType) {
      default:
        // Parse options if it's a select
        let selectOptions: { value: string; label: string }[] = [];
        if (inputType === 'select') {
          const rawOptions = s.options || (typeof s.validationRules === 'object' ? (s.validationRules as any).options : null);
          if (Array.isArray(rawOptions)) {
            selectOptions = rawOptions.map(opt =>
              typeof opt === 'string' ? { value: opt, label: opt.charAt(0).toUpperCase() + opt.slice(1) } : opt
            );
          }
        }

        if (inputType === 'select') {
          return (
            <div className="space-y-2">
              <Label>{s.displayName}</Label>
              <Select
                value={String(value)}
                onValueChange={(val) => updateLocalSetting(s.key, val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={s.placeholder || 'Select option'} />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <Label>{s.displayName}</Label>
            <div className="relative">
              {s.key.includes('email') && <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
              {s.key.includes('phone') && <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
              {s.key.includes('amount') || s.key.includes('threshold') || s.key.includes('charge') || s.key.includes('rate') || s.key.includes('limit') ? (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {currentSettings?.currency_symbol || 'Rs.'}
                </div>
              ) : null}
              <Input
                type={s.dataType === 'number' ? 'number' : (inputType === 'password' ? 'password' : 'text')}
                className={(s.key.includes('email') || s.key.includes('phone') || s.key.includes('amount') || s.key.includes('threshold') || s.key.includes('charge') || s.key.includes('rate') || s.key.includes('limit')) ? 'pl-10' : ''}
                value={value ?? ''}
                onChange={(e) => updateLocalSetting(s.key, s.dataType === 'number' ? parseFloat(e.target.value) : e.target.value)}
                placeholder={s.placeholder || ''}
              />
            </div>
            {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
          </div>
        );
    }
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500">Configure Weththasinghe Distributors platform and preferences</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isSearching ? "animate-spin text-emerald-500" : "text-slate-400")} />
          <Input
            className="pl-10 h-10 bg-white border-slate-200"
            placeholder="Search all settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {Object.keys(settingsByGroup)
            .filter(category => category !== 'email' && category !== 'sms')
            .map(category => {
              const iconMap: Record<string, any> = {
                general: <Store className="w-4 h-4" />,
                store: <Store className="w-4 h-4" />,
                notifications: <Bell className="w-4 h-4" />,
                orders: <TruckIcon className="w-4 h-4" />,
                inventory: <Package className="w-4 h-4" />,
                email: <Mail className="w-4 h-4" />,
                sms: <Phone className="w-4 h-4" />,
                credit: <CreditCard className="w-4 h-4" />,
                tax: <Percent className="w-4 h-4" />,
                security: <Shield className="w-4 h-4" />,
                business: <Palette className="w-4 h-4" />,
                loyalty: <Plus className="w-4 h-4" />,
                shipping: <Truck className="w-4 h-4" />
              };

              const labelMap: Record<string, string> = {
                general: 'General',
                store: 'General',
                notifications: 'Notifications',
                orders: 'Orders',
                inventory: 'Inventory',
                email: 'Email',
                sms: 'SMS',
                credit: 'Credit',
                tax: 'Tax',
                security: 'Security',
                business: 'Business'
              };

              return (
                <TabsTrigger
                  key={category}
                  value={category === 'general' ? 'store' : category}
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm border px-4 py-2"
                >
                  {iconMap[category] || <Database className="w-4 h-4" />}
                  <span>{labelMap[category] || category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </TabsTrigger>
              );
            })}
          <TabsTrigger value="security_manual" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm border px-4 py-2">
            <Shield className="w-4 h-4" />
            <span>Account Security</span>
          </TabsTrigger>
        </TabsList>

        {Object.entries(settingsByGroup)
          .filter(([category]) => category !== 'email' && category !== 'sms')
          .map(([category, settings]) => (
            <TabsContent key={category} value={category === 'general' ? 'store' : category}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                  <div>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      {category.replace('_', ' ')} Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your {category.replace('_', ' ')} preferences and rules
                    </CardDescription>
                  </div>
                  <Button onClick={() => saveCategorySettings(category)} disabled={saving} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : `Save ${category.charAt(0).toUpperCase() + category.slice(1)}`}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.map(s => (
                      <div key={s.id} className={s.inputType === 'textarea' ? 'md:col-span-2' : ''}>
                        {renderSettingField(s)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

        {/* Manual Security Actions */}
        <TabsContent value="security_manual">
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
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      user?.twoFactorEnabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        2FA is {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {user?.twoFactorEnabled
                          ? 'Your account is protected with an extra layer of security.'
                          : 'Add an extra layer of security to your account by requiring an email code.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={user?.twoFactorEnabled ? "outline" : "default"}
                    onClick={handleToggle2FA}
                  >
                    {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
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
                        <p className="text-sm text-slate-500">Windows • Chrome • Colombo, Sri Lanka</p>
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

      <Dialog open={twoFactorModalOpen} onOpenChange={setTwoFactorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to your email. Please enter it below to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="2fa-code">Verification Code</Label>
            <Input
              id="2fa-code"
              placeholder="Enter 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="mt-2 text-center text-2xl tracking-[0.5em] font-bold"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTwoFactorModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmEnable2FA} disabled={verifying2FA || twoFactorCode.length !== 6}>
              {verifying2FA ? 'Verifying...' : 'Confirm Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
