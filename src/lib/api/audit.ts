import api from './client';
import type { ApiResponse } from '@/types';

export interface AuditLog {
    id: number;
    action: string;
    module?: string;
    tableName?: string;
    entityType?: string;
    entityId?: number;
    description?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    userId?: number;
    user?: {
        id: number;
        firstName: string;
        lastName?: string;
        userName: string;
        phone?: string;
    };
    createdAt: string;
}

export interface AuditLogFilters {
    page?: number;
    limit?: number;
    action?: string;
    tableName?: string;
    userId?: number;
    entityType?: string;
    entityId?: number;
    riskLevel?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface AuditStats {
    actions: Record<string, number>;
    entities: { entity: string; count: number }[];
    riskLevels: Record<string, number>;
    activeUsers: { user: AuditLog['user']; count: number }[];
    highRiskActions: AuditLog[];
    dailyActivity: { date: string; count: number }[];
}

export interface PaginatedAuditLogs {
    logs: AuditLog[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const auditApi = {
    async getLogs(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
        const response = await api.get<ApiResponse<PaginatedAuditLogs>>('/audit-logs', { params: filters });
        return response.data.data;
    },

    async getLog(id: number): Promise<AuditLog> {
        const response = await api.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
        return response.data.data;
    },

    async getStats(startDate?: string, endDate?: string): Promise<AuditStats> {
        const response = await api.get<ApiResponse<AuditStats>>('/audit-logs/stats', {
            params: { startDate, endDate },
        });
        return response.data.data;
    },

    async getLoginHistory(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
        const response = await api.get<ApiResponse<PaginatedAuditLogs>>('/audit-logs/logins', { params: filters });
        return response.data.data;
    },

    async getUserActivity(userId: number, filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
        const response = await api.get<ApiResponse<PaginatedAuditLogs>>(`/audit-logs/user/${userId}`, { params: filters });
        return response.data.data;
    },

    async getEntityHistory(entityType: string, entityId: number, filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
        const response = await api.get<ApiResponse<PaginatedAuditLogs>>(`/audit-logs/entity/${entityType}/${entityId}`, { params: filters });
        return response.data.data;
    },

    async exportCSV(filters: AuditLogFilters = {}): Promise<void> {
        const response = await api.get('/audit-logs/export', {
            params: { ...filters, format: 'csv' },
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};
