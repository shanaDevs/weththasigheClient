import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-20 mb-3" />
        <div className="flex items-baseline gap-2 mb-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-8 w-1/2" />
          </div>
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
