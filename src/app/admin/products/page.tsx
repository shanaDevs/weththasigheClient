'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  FolderTree,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { adminApi, type ProductFilters } from '@/lib/api/admin';
import type { Product, Category, Agency, ProductBatch, Supplier } from '@/types';
import { cn } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

export default function AdminProductsPage() {
  const { settings, formatPrice } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [uploadingImages, setUploadingImages] = useState(false);

  // Batch management state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [productBatches, setProductBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showAddBatchForm, setShowAddBatchForm] = useState(false);
  const [batchFormData, setBatchFormData] = useState<Partial<ProductBatch>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Category management state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryDeleteDialog, setShowCategoryDeleteDialog] = useState(false);
  const [showCategoryFormDialog, setShowCategoryFormDialog] = useState(false);
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<{ name: string; description?: string; icon?: string; parentId?: number; image?: string }>({ name: '' });
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getProducts({ ...filters, search: searchQuery || undefined });
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await adminApi.getCategories();
      setCategories(cats as Category[]);
    } catch (error) {
      console.error('Failed to load categories');
    }
  }, []);

  const fetchAgencies = useCallback(async () => {
    try {
      const result = await adminApi.getAgencies();
      setAgencies(result);
    } catch (error) {
      console.error('Failed to load agencies');
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const result = await adminApi.getBrands();
      setBrands(result);
    } catch (error) {
      console.error('Failed to load brands');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
    fetchAgencies();
    fetchBrands();
  }, [fetchCategories, fetchAgencies, fetchBrands]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await adminApi.deleteProduct(selectedProduct.id);
      toast.success('Product deleted successfully');
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleSubmitForm = async () => {
    try {
      if (isEditing && selectedProduct) {
        await adminApi.updateProduct(selectedProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await adminApi.createProduct(formData);
        toast.success('Product created successfully');
      }
      setShowFormDialog(false);
      setFormData({});
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product');
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setIsEditing(true);
    setShowFormDialog(true);
  };

  // Category handlers
  const handleCategoryDelete = async () => {
    if (!selectedCategory) return;
    try {
      await adminApi.deleteCategory(selectedCategory.id);
      toast.success('Category deleted successfully');
      setShowCategoryDeleteDialog(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category. Make sure it has no products.');
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      if (isCategoryEditing && selectedCategory) {
        await adminApi.updateCategory(selectedCategory.id, categoryFormData);
        toast.success('Category updated successfully');
      } else {
        await adminApi.createCategory(categoryFormData);
        toast.success('Category created successfully');
      }
      setShowCategoryFormDialog(false);
      setCategoryFormData({ name: '' });
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(isCategoryEditing ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const openCategoryEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      image: category.image || '',
    });
    setIsCategoryEditing(true);
    setShowCategoryFormDialog(true);
  };

  const openCategoryCreateDialog = () => {
    setSelectedCategory(null);
    setCategoryFormData({ name: '', description: '', icon: '', image: '' });
    setIsCategoryEditing(false);
    setShowCategoryFormDialog(true);
  };

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setFormData({
      isActive: true,
      taxEnabled: true,
      requiresPrescription: false,
      minOrderQuantity: 1,
      maxOrderQuantity: 100
    } as Partial<Product>);
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Out of Stock</Badge>;
    }
    if (quantity < 10) {
      return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600"><AlertTriangle className="w-3 h-3" /> Low Stock</Badge>;
    }
    return <Badge variant="outline" className="gap-1 border-emerald-500 text-emerald-600"><CheckCircle className="w-3 h-3" /> In Stock</Badge>;
  };

  const fetchBatches = async (productId: number) => {
    setLoadingBatches(true);
    try {
      const batches = await adminApi.getProductBatches(productId);
      setProductBatches(batches);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const sups = await adminApi.getSuppliers();
      setSuppliers(sups);
    } catch (error) {
      console.error('Failed to load suppliers');
    }
  };

  const openBatchDialog = (product: Product) => {
    setSelectedProduct(product);
    fetchBatches(product.id);
    fetchSuppliers();
    setShowBatchDialog(true);
  };

  const handleAddBatch = async () => {
    if (!selectedProduct || !batchFormData.batchNumber || !batchFormData.expiryDate) {
      toast.error('Batch number and expiry date are required');
      return;
    }

    try {
      await adminApi.addProductBatch(selectedProduct.id, batchFormData);
      toast.success('Batch added successfully');
      setShowAddBatchForm(false);
      setBatchFormData({});
      fetchBatches(selectedProduct.id);
      fetchProducts(); // Refresh main stock
    } catch (error) {
      toast.error('Failed to add batch');
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    try {
      await adminApi.deleteProductBatch(batchId);
      toast.success('Batch deleted');
      if (selectedProduct) {
        fetchBatches(selectedProduct.id);
        fetchProducts();
      }
    } catch (error) {
      toast.error('Failed to delete batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products & Categories</h1>
          <p className="text-slate-500">Manage your product catalog and categories</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Products ({pagination.total})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="w-4 h-4" />
            Categories ({categories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex items-center justify-end mb-4">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
          <Card>
            <CardHeader className="border-b">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={filters.categoryId?.toString() || 'all'}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, categoryId: v === 'all' ? undefined : parseInt(v), page: 1 }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.agencyId?.toString() || 'all'}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, agencyId: v === 'all' ? undefined : parseInt(v), page: 1 }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Agencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agencies</SelectItem>
                    {agencies.map(agency => (
                      <SelectItem key={agency.id} value={agency.id.toString()}>{agency.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No products found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                {product.thumbnail ? (
                                  <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 line-clamp-1">{product.name}</p>
                                <p className="text-xs text-slate-500">
                                  {product.agency?.name || product.manufacturer || '—'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-600">{product.sku}</TableCell>
                          <TableCell>{product.category?.name || '—'}</TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{formatPrice(product.sellingPrice)}</p>
                              {product.mrp !== product.sellingPrice && (
                                <p className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{product.stockQuantity}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{product.priority || 0}</Badge>
                          </TableCell>
                          <TableCell>{getStockBadge(product.stockQuantity)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(`/products/${product.slug}`, '_blank')}>
                                  <Eye className="w-4 h-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openBatchDialog(product)}>
                                  <Package className="w-4 h-4 mr-2" /> Manage Batches
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }}
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
                      Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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
        </TabsContent>

        <TabsContent value="categories">
          <div className="flex items-center justify-end mb-4">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCategoryCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">All Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {categories.length === 0 ? (
                <div className="text-center py-20">
                  <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No categories found</p>
                  <Button variant="outline" className="mt-4" onClick={openCategoryCreateDialog}>
                    Create your first category
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center overflow-hidden">
                              {category.image ? (
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                              ) : category.icon ? (
                                <span className="text-lg">{category.icon}</span>
                              ) : (
                                <FolderTree className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                            <span className="font-medium text-slate-900">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{category.slug}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-slate-500">
                          {category.description || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{category.productCount || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openCategoryEditDialog(category)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => { setSelectedCategory(category); setShowCategoryDeleteDialog(true); }}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedProduct?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Product Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update product details below' : 'Fill in the product details below'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Enter SKU"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId?.toString() || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency">Agency / Manufacturer Record</Label>
                <Select
                  value={formData.agencyId?.toString() || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, agencyId: v === 'none' ? undefined : parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an official agency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {agencies.map(agency => (
                      <SelectItem key={agency.id} value={agency.id.toString()}>{agency.name} ({agency.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retailPrice">Retail Price</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  value={formData.retailPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, retailPrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  value={formData.wholesalePrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributorPrice">Distributor Price</Label>
                <Input
                  id="distributorPrice"
                  type="number"
                  value={formData.distributorPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, distributorPrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Public Selling Price *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={formData.sellingPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP</Label>
                <Input
                  id="mrp"
                  type="number"
                  value={formData.mrp || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agencyId">Agency (Distributor)</Label>
                <Select
                  value={formData.agencyId?.toString()}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, agencyId: parseInt(val) }))}
                >
                  <SelectTrigger id="agencyId">
                    <SelectValue placeholder="Select Agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id.toString()}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={formData.brand || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, brand: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={formData.genericName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genericName: e.target.value }))}
                  placeholder="Enter generic name"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="requiresPrescription"
                  checked={!!formData.requiresPrescription}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresPrescription: !!checked }))}
                />
                <Label htmlFor="requiresPrescription">Requires Prescription</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="taxEnabled"
                  checked={formData.taxEnabled !== false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, taxEnabled: !!checked }))}
                />
                <Label htmlFor="taxEnabled">Tax Enabled</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isFeatured"
                  checked={!!formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: !!checked }))}
                />
                <Label htmlFor="isFeatured" className="text-emerald-700 font-medium">Featured Product</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="isMaxOrderRestricted"
                  checked={!!formData.isMaxOrderRestricted}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMaxOrderRestricted: !!checked }))}
                />
                <Label htmlFor="isMaxOrderRestricted" className="font-medium text-orange-700">Restrict Max Order Quantity</Label>
              </div>
              {formData.isMaxOrderRestricted && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <Label htmlFor="maxOrderQuantity">Max Order Quantity *</Label>
                  <Input
                    id="maxOrderQuantity"
                    type="number"
                    value={formData.maxOrderQuantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxOrderQuantity: parseInt(e.target.value) }))}
                    placeholder="Enter limit"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Display Priority (Higher shows first)</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Product Images (Up to 8)</Label>
              <div className="grid grid-cols-4 gap-3">
                {(formData.images || []).map((img: string, idx: number) => (
                  <div key={idx} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden">
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...(formData.images || [])];
                        newImages.splice(idx, 1);
                        setFormData(prev => ({ ...prev, images: newImages, thumbnail: newImages[0] || undefined }));
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!formData.images || formData.images.length < 8) && (
                  <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingImages}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        const remainingSlots = 8 - (formData.images || []).length;
                        const filesToUpload = files.slice(0, remainingSlots);

                        if (filesToUpload.length < files.length) {
                          toast.error(`Only ${remainingSlots} more image(s) can be added`);
                        }

                        setUploadingImages(true);
                        try {
                          // Upload to backend/Cloudinary
                          const uploadedUrls = await adminApi.uploadProductImages(filesToUpload);
                          const newImages = [...(formData.images || []), ...uploadedUrls];
                          setFormData(prev => ({
                            ...prev,
                            images: newImages,
                            thumbnail: prev.thumbnail || newImages[0]
                          }));
                          toast.success(`${filesToUpload.length} image(s) uploaded successfully`);
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast.error('Failed to upload images');
                        } finally {
                          setUploadingImages(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    {uploadingImages ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500">Add Image</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Upload up to 8 images. First image will be used as thumbnail.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitForm}>
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation Dialog */}
      <Dialog open={showCategoryDeleteDialog} onOpenChange={setShowCategoryDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;? This action cannot be undone.
              {(selectedCategory?.productCount || 0) > 0 && (
                <span className="block mt-2 text-orange-600">
                  Warning: This category has {selectedCategory?.productCount} product(s). You may need to reassign them first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCategoryDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Category Dialog */}
      <Dialog open={showCategoryFormDialog} onOpenChange={setShowCategoryFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCategoryEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {isCategoryEditing ? 'Update category details below' : 'Fill in the category details below'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                rows={3}
                value={categoryFormData.description || ''}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryIcon">Icon (emoji)</Label>
              <Input
                id="categoryIcon"
                value={categoryFormData.icon || ''}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="e.g. 💊"
                maxLength={4}
              />
              <p className="text-xs text-slate-500">Enter an emoji to represent this category</p>
            </div>
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-4">
                {categoryFormData.image ? (
                  <div className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden group">
                    <img src={categoryFormData.image} alt="Category" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCategoryFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingCategoryImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingCategoryImage(true);
                        try {
                          const url = await adminApi.uploadCategoryImage(file);
                          setCategoryFormData(prev => ({ ...prev, image: url }));
                          toast.success('Category image uploaded');
                        } catch (error) {
                          toast.error('Failed to upload image');
                        } finally {
                          setUploadingCategoryImage(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    {uploadingCategoryImage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-500">Upload</span>
                      </>
                    )}
                  </label>
                )}
                <div className="flex-1 text-xs text-slate-500">
                  <p>Upload a clear image for the category. Recommended size: 200x200px.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryFormDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCategorySubmit}>
              {isCategoryEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Batch Management Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Package className="w-5 h-5 text-emerald-600" />
              Manage Batches: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              View and manage inventory batches for this product.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Active Batches</h3>
              {!showAddBatchForm && (
                <Button size="sm" onClick={() => setShowAddBatchForm(true)} className="bg-emerald-600 hover:bg-emerald-700" type="button">
                  <Plus className="w-4 h-4 mr-1" /> Add Batch
                </Button>
              )}
            </div>

            {showAddBatchForm && (
              <Card className="border-emerald-100 bg-emerald-50/30 animate-in slide-in-from-top-2 duration-200">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-sm font-bold text-emerald-800">New Batch Entry</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddBatchForm(false)} className="h-8 w-8 p-0" type="button">
                    <XCircle className="w-4 h-4 text-slate-400" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="batchNo" className="text-xs text-slate-700">Batch Number *</Label>
                      <Input
                        id="batchNo"
                        size={1}
                        className="h-9 px-3 text-sm text-slate-900"
                        value={batchFormData.batchNumber || ''}
                        onChange={e => setBatchFormData({ ...batchFormData, batchNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="expiry" className="text-xs text-slate-700">Expiry Date *</Label>
                      <Input
                        id="expiry"
                        type="date"
                        className="h-9 px-3 text-sm text-slate-900"
                        value={batchFormData.expiryDate || ''}
                        onChange={e => setBatchFormData({ ...batchFormData, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batchQty" className="text-xs text-slate-700">Stock Quantity</Label>
                      <Input
                        id="batchQty"
                        type="number"
                        className="h-9 px-3 text-sm text-slate-900"
                        placeholder="0"
                        value={batchFormData.stockQuantity || ''}
                        onChange={e => setBatchFormData({ ...batchFormData, stockQuantity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batchMRP" className="text-xs text-slate-700">MRP / Selling Price</Label>
                      <div className="flex gap-2">
                        <Input
                          id="batchMRP"
                          type="number"
                          className="h-9 px-2 text-xs text-slate-900"
                          placeholder="MRP"
                          value={batchFormData.mrp || ''}
                          onChange={e => setBatchFormData({ ...batchFormData, mrp: e.target.value })}
                        />
                        <Input
                          id="batchSell"
                          type="number"
                          className="h-9 px-2 text-xs text-slate-900"
                          placeholder="Sale"
                          value={batchFormData.sellingPrice || ''}
                          onChange={e => setBatchFormData({ ...batchFormData, sellingPrice: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="batchSupplier" className="text-xs text-slate-700">Supplier</Label>
                      <Select
                        value={batchFormData.supplierId?.toString() || 'none'}
                        onValueChange={v => setBatchFormData({ ...batchFormData, supplierId: v === 'none' ? undefined : parseInt(v) })}
                      >
                        <SelectTrigger className="h-9 text-sm text-slate-900">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={handleAddBatch} type="button">
                        Confirm Add Batch
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="py-3 text-xs font-bold uppercase text-slate-500">Batch No</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500">Supplier</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500">Expiry</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Price (MRP)</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Sale Price</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Stock</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBatches ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                        <span className="text-sm text-slate-500 mt-2 block font-normal">Loading batches...</span>
                      </TableCell>
                    </TableRow>
                  ) : productBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-400 italic font-normal">
                        No batches found for this product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    productBatches.map(batch => (
                      <TableRow key={batch.id} className={cn(
                        new Date(batch.expiryDate) < new Date() ? 'bg-red-50/50' : ''
                      )}>
                        <TableCell className="font-bold text-slate-700 text-sm whitespace-nowrap">{batch.batchNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{(batch as any).supplier?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-xs font-medium whitespace-nowrap",
                              new Date(batch.expiryDate) < new Date() ? "text-red-600" : "text-slate-900"
                            )}>
                              {new Date(batch.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                            </span>
                            {new Date(batch.expiryDate) < new Date() && (
                              <Badge variant="destructive" className="w-fit scale-75 -ml-2 h-4 px-1 text-[8px]">EXPIRED</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-500 font-mono text-xs">
                          {formatPrice(batch.mrp || 0)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-bold font-mono text-xs">
                          {formatPrice(batch.sellingPrice || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={batch.stockQuantity <= 0 ? 'destructive' : 'outline'} className="font-mono text-[10px] h-5">
                            {batch.stockQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteBatch(batch.id)}
                            type="button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowBatchDialog(false)} type="button">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
