'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store';
import { doctorService } from '@/lib/api';
import { toast } from 'sonner';
import type { Address } from '@/types';

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/addresses');
      return;
    }

    const loadAddresses = async () => {
      try {
        const data = await doctorService.getAddresses();
        setAddresses(data);
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAddresses();
  }, [isAuthenticated, router]);

  const handleSetDefault = async (id: number) => {
    try {
      await doctorService.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );
      toast.success('Default address updated');
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to update default address');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await doctorService.deleteAddress(deleteId);
      setAddresses((prev) => prev.filter((addr) => addr.id !== deleteId));
      toast.success('Address deleted');
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete address');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Addresses</h1>
            <p className="text-slate-600 mt-1">Manage your delivery addresses</p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Link href="/addresses/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Link>
          </Button>
        </motion.div>

        {/* Addresses Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No addresses saved</h2>
            <p className="text-slate-600 mb-6">Add a delivery address to get started</p>
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600">
              <Link href="/addresses/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative ${address.isDefault ? 'ring-2 ring-emerald-500' : ''}`}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{address.contactName}</CardTitle>
                        {address.isDefault && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/addresses/${address.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!address.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(address.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteId(address.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{address.addressLine1}</p>
                    {address.addressLine2 && (
                      <p className="text-sm text-slate-600">{address.addressLine2}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {address.city}, {address.state} - {address.postalCode}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">{address.contactPhone}</p>
                    <Badge variant="outline" className="mt-2 capitalize">
                      {address.type}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
