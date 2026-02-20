'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsService } from '@/lib/api/misc';
import { PublicSettings } from '@/types';

interface SettingsContextType {
    settings: PublicSettings | null;
    isLoading: boolean;
    error: any;
    refresh: () => Promise<void>;
    formatPrice: (amount: number | string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<PublicSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const formatPrice = (amount: number | string): string => {
        const symbol = settings?.currency_symbol || 'Rs.';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `${symbol}${num.toLocaleString('en-LK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
    };

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const data = await settingsService.getPublicSettings();
            setSettings(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                isLoading,
                error,
                refresh: fetchSettings,
                formatPrice
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
