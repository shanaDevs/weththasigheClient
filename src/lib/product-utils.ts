import { Product, User } from '@/types';

export function getProductPrice(product: Product, user: User | null): string {
    if (!user || !user.role) return product.sellingPrice;

    const roleName = user.role.name.toLowerCase();

    // High precedence roles
    if (roleName === 'admin' || roleName === 'superadmin') {
        return product.sellingPrice;
    }

    if (roleName === 'distributor' && product.distributorPrice) {
        return product.distributorPrice;
    }

    if ((roleName === 'wholesale' || roleName === 'retailer' || roleName === 'doctor') && product.wholesalePrice) {
        return product.wholesalePrice;
    }

    if ((roleName === 'customer' || roleName === 'user') && product.retailPrice) {
        return product.retailPrice;
    }

    return product.sellingPrice;
}

export function getPriceLabel(user: User | null): string {
    if (!user || !user.role) return 'Price';

    const roleName = user.role.name.toLowerCase();

    if (roleName === 'distributor') return 'Distributor Price';
    if (roleName === 'wholesale' || roleName === 'retailer' || roleName === 'doctor') return 'Wholesale Price';
    if (roleName === 'customer' || roleName === 'user') return 'Retail Price';

    return 'Selling Price';
}
