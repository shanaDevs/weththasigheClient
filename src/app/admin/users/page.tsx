'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Shield,
  CreditCard,
  Phone,
  Building,
  MoreHorizontal,
  UserCheck,
  UserX,
  Stethoscope,
  Plus,
  Upload,
  X,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { adminApi, type UserFilters } from '@/lib/api/admin';
import type { Doctor, User, AdminCreateUserInput } from '@/types';




export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<AdminCreateUserInput>({
    firstName: '',
    lastName: '',
    userName: '',
    phone: '',
    roleName: 'user',
    licenseNumber: '',
    licensePhoto: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getUsers({ ...filters, search: searchQuery || undefined });
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleToggleStatus = async (user: User) => {
    setUpdating(true);
    try {
      await adminApi.updateUserStatus(user.id, !user.isDisabled);
      toast.success(user.isDisabled ? 'User activated' : 'User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleResendEmail = async (user: User) => {
    try {
      await adminApi.resendUserVerification(user.id);
      toast.success(`Verification email resent to ${(user as any).email || user.phone}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to resend verification email');
    }
  };

  const handleUpdateCreditString = async () => {
    if (!selectedDoctor || !creditLimit) return;
    setUpdating(true);
    try {
      await adminApi.updateDoctorCredit(selectedDoctor.id, parseFloat(creditLimit));
      toast.success('Credit limit updated');
      setShowCreditDialog(false);
      setCreditLimit('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update credit limit');
    } finally {
      setUpdating(false);
    }
  };

  const openDetailDialog = async (user: User) => {
    setSelectedUser(user);
    if (user.role.name === 'doctor' && user.doctorProfile) {
      try {
        const fullDoctor = await adminApi.getDoctor(user.doctorProfile.id);
        setSelectedDoctor(fullDoctor);
      } catch {
        setSelectedDoctor(null);
      }
    } else {
      setSelectedDoctor(null);
    }
    setShowDetailDialog(true);
  };

  const openCreditDialog = (user: User) => {
    if (!user.doctorProfile) return;
    setSelectedUser(user);
    // We need the full doctor profile to get the current credit limit
    adminApi.getDoctor(user.doctorProfile.id).then(doctor => {
      setSelectedDoctor(doctor);
      setCreditLimit(doctor.creditLimit);
      setShowCreditDialog(true);
    }).catch(() => {
      toast.error('Failed to load doctor credit data');
    });
  };

  const getStatusBadge = (user: User) => {
    if (!user.isDisabled) {
      return (
        <Badge variant="outline" className="text-emerald-600 border-emerald-500">
          <UserCheck className="w-3 h-3 mr-1" /> Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-red-600 border-red-500">
        <UserX className="w-3 h-3 mr-1" /> Inactive
      </Badge>
    );
  };

  const getRoleBadge = (user: User) => {
    const isDoctor = user.role.name === 'doctor';
    return (
      <Badge className={isDoctor ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-none" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-none"}>
        {isDoctor ? <Stethoscope className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
        {user.role.displayName}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500">Manage all registered users and doctors ({pagination.total} total)</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => !u.isDisabled).length}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.isDisabled).length}</p>
                <p className="text-sm text-slate-500">Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Stethoscope className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role.name === 'doctor').length}</p>
                <p className="text-sm text-slate-500">Doctors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or username..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={filters.isActive?.toString() || 'all'}
              onValueChange={(v) => setFilters(prev => ({ ...prev, isActive: v === 'all' ? undefined : v === 'true', page: 1 }))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Profile Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {user.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-slate-600">{user.userName}</span>
                      </TableCell>
                      <TableCell>{getRoleBadge(user)}</TableCell>
                      <TableCell>
                        {user.doctorProfile ? (
                          <div className="text-sm">
                            <p className="font-medium flex items-center gap-1">
                              <Building className="w-3 h-3" /> {user.doctorProfile.hospitalClinic || 'No Clinic'}
                            </p>
                            <p className="text-xs text-slate-500">Reg: {user.doctorProfile.licenseNumber}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailDialog(user)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {user.doctorProfile && (
                              <DropdownMenuItem onClick={() => openCreditDialog(user)}>
                                <CreditCard className="w-4 h-4 mr-2" /> Edit Credit
                              </DropdownMenuItem>
                            )}
                            {!user.isVerified && user.role.name !== 'doctor' && (
                              <DropdownMenuItem onClick={() => handleResendEmail(user)}>
                                <Mail className="w-4 h-4 mr-2" /> Resend Verification
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(user)}
                              className={!user.isDisabled ? 'text-red-600' : 'text-emerald-600'}
                            >
                              {!user.isDisabled ? (
                                <><UserX className="w-4 h-4 mr-2" /> Disable</>
                              ) : (
                                <><UserCheck className="w-4 h-4 mr-2" /> Enable</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-slate-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3">Page {pagination.page} of {pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {getRoleBadge(selectedUser)}
                {getStatusBadge(selectedUser)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-slate-500">Username</p>
                  <p className="font-medium font-mono">{selectedUser.userName}</p>
                </div>
              </div>

              {selectedDoctor && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Doctor Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Registration Number</p>
                        <p className="font-medium font-mono">{selectedDoctor.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Specialization</p>
                        <p className="font-medium">{selectedDoctor.specialization || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Clinic Name</p>
                        <p className="font-medium">{selectedDoctor.hospitalClinic || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500">Address</p>
                        <p className="font-medium">{selectedDoctor.address || '—'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Credit Information</h4>
                      <div className="grid grid-cols-3 gap-4 text-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-lg font-bold text-slate-900">Rs.{parseFloat(selectedDoctor.creditLimit).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Limit</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">Rs.{parseFloat(selectedDoctor.creditUsed).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Used</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-600">
                            Rs.{(parseFloat(selectedDoctor.creditLimit) - parseFloat(selectedDoctor.creditUsed)).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">Avail.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="text-xs text-slate-400">
                Registered on {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedUser?.doctorProfile && (
              <Button
                onClick={() => { setShowDetailDialog(false); openCreditDialog(selectedUser); }}
              >
                <CreditCard className="w-4 h-4 mr-2" /> Edit Credit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Credit Limit</DialogTitle>
            <DialogDescription>
              Set credit limit for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Credit Used</Label>
              <p className="text-lg font-medium text-red-600">
                Rs.{selectedDoctor ? parseFloat(selectedDoctor.creditUsed).toLocaleString() : 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">New Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="Enter credit limit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUpdateCreditString}
              disabled={updating || !creditLimit}
            >
              {updating ? 'Updating...' : 'Update Credit Limit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setFormData({
            firstName: '',
            lastName: '',
            userName: '',
            phone: '',
            roleName: 'user',
            licenseNumber: '',
            licensePhoto: '',
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user or doctor account. They will receive a verification email to set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07XXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleName">User Role</Label>
              <Select
                value={formData.roleName}
                onValueChange={(v) => setFormData({ ...formData, roleName: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.roleName === 'doctor' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Medical License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber || ''}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="Reg: 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>License Photo (Optional)</Label>
                  <div className="flex flex-col gap-2">
                    {formData.licensePhoto ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                        <img
                          src={formData.licensePhoto}
                          alt="License"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => setFormData({ ...formData, licensePhoto: '' })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="license-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploading(true);
                            try {
                              const url = await adminApi.uploadCategoryImage(file);
                              setFormData({ ...formData, licensePhoto: url });
                              toast.success('License photo uploaded');
                            } catch {
                              toast.error('Upload failed');
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                          disabled={isUploading}
                          asChild
                        >
                          <label htmlFor="license-upload" className="cursor-pointer">
                            {isUploading ? 'Uploading...' : <><Upload className="w-4 h-4 mr-2" /> Upload License Photo</>}
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={async () => {
                if (!formData.firstName || !formData.phone) {
                  toast.error('First name and phone are required');
                  return;
                }
                setUpdating(true);
                try {
                  await adminApi.adminCreateUser(formData);
                  toast.success('User created successfully. Verification email sent.');
                  setShowAddDialog(false);
                  fetchUsers();
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Failed to create user');
                } finally {
                  setUpdating(false);
                }
              }}
              disabled={updating || isUploading}
            >
              {updating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
