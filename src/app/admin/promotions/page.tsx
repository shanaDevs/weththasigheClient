'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tags,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { adminApi, type PromotionFilters, type Promotion, type CreatePromotionData } from '@/lib/api/admin';

const PROMOTION_TYPES = [
  { value: 'flash_sale', label: 'Flash Sale' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'volume_discount', label: 'Volume Discount' },
  { value: 'new_customer', label: 'New Customer' },
  { value: 'loyalty', label: 'Loyalty' },
  { value: 'banner_only', label: 'Banner Only' },
];

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'special_price', label: 'Special Price' },
];

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters] = useState<PromotionFilters>({ page: 1, limit: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePromotionData>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getPromotions({ ...filters, search: searchQuery || undefined });
      setPromotions(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;
    try {
      await adminApi.deletePromotion(selectedPromotion.id);
      toast.success('Promotion deleted successfully');
      setShowDeleteDialog(false);
      setSelectedPromotion(null);
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  const handleSubmitForm = async () => {
    if (!formData.name || !formData.type || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing && selectedPromotion) {
        await adminApi.updatePromotion(selectedPromotion.id, formData);
        toast.success('Promotion updated successfully');
      } else {
        await adminApi.createPromotion(formData as CreatePromotionData);
        toast.success('Promotion created successfully');
      }
      setShowFormDialog(false);
      setFormData({});
      setSelectedPromotion(null);
      fetchPromotions();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update promotion' : 'Failed to create promotion');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = async (promotion: Promotion) => {
    try {
      const fullPromotion = await adminApi.getPromotion(promotion.id);
      setSelectedPromotion(fullPromotion);
      setFormData({
        name: fullPromotion.name,
        description: fullPromotion.description,
        type: fullPromotion.type,
        discountType: fullPromotion.discountType,
        discountValue: fullPromotion.discountValue ? parseFloat(fullPromotion.discountValue) : undefined,
        startDate: fullPromotion.startDate?.split('T')[0],
        endDate: fullPromotion.endDate?.split('T')[0],
        isActive: fullPromotion.isActive,
        bannerImage: fullPromotion.bannerImage,
        displayOrder: fullPromotion.displayOrder,
      });
      setIsEditing(true);
      setShowFormDialog(true);
    } catch {
      toast.error('Failed to load promotion details');
    }
  };

  const openCreateDialog = () => {
    setSelectedPromotion(null);
    setFormData({
      isActive: true,
      type: 'flash_sale',
      discountType: 'percentage',
    });
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return <Badge variant="outline" className="text-slate-500"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>;
    }
    if (now < start) {
      return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
    }
    if (now > end) {
      return <Badge variant="outline" className="text-slate-500"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = PROMOTION_TYPES.find(t => t.value === type);
    return <Badge variant="outline">{typeConfig?.label || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
          <p className="text-slate-500">Manage deals and promotions ({pagination.total} total)</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search promotions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={filters.type || 'all'}
              onValueChange={(v) => setFilters(prev => ({ ...prev, type: v === 'all' ? undefined : v, page: 1 }))}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROMOTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
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
          ) : promotions.length === 0 ? (
            <div className="text-center py-20">
              <Tags className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No promotions found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promotion</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{promotion.name}</p>
                          <p className="text-sm text-slate-500 line-clamp-1">{promotion.description || 'No description'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(promotion.type)}</TableCell>
                      <TableCell>
                        {promotion.discountValue ? (
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium">
                              {promotion.discountType === 'percentage'
                                ? `${promotion.discountValue}%`
                                : `Rs.${parseFloat(promotion.discountValue).toLocaleString()}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(promotion.startDate).toLocaleDateString()}</p>
                          <p className="text-slate-400">to {new Date(promotion.endDate).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{promotion.displayOrder || 0}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(promotion)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(promotion)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setSelectedPromotion(promotion); setShowDeleteDialog(true); }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
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
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} promotions
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPromotion?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Promotion Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update promotion details below' : 'Fill in the promotion details below'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Promotion Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter promotion name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter promotion description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMOTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discountType || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, discountType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerImage">Banner Image URL</Label>
              <Input
                id="bannerImage"
                value={formData.bannerImage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bannerImage: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order (Higher shows first)</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive !== false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmitForm}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Promotion' : 'Create Promotion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
