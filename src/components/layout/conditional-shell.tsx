'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';

// Routes that should NOT show the store header/footer
const NO_SHELL_PREFIXES = ['/admin', '/login', '/register', '/setup-password', '/verify-account'];

export function ConditionalShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isShellHidden = NO_SHELL_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isShellHidden) {
        // Admin / auth pages: render children directly, no store header/footer
        return <>{children}</>;
    }

    // Store pages: wrap with header + footer
    return (
        <>
            <Header />
            <main className="flex-1 pt-16 lg:pt-20">
                {children}
            </main>
            <Footer />
        </>
    );
}
