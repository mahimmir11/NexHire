import { prisma } from '../config/database.js';

export interface CreateAuditLogParams {
  userId?: number | null;
  action: string;
  entity: string;
  entityId: string | number;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

// Redact sensitive keys from audit logs
const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'token', 'refreshToken', 'secret']);

function sanitize(obj: Record<string, any> | null | undefined): string | null {
  if (!obj) return null;
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) {
      safe[k] = '[REDACTED]';
    } else {
      safe[k] = v;
    }
  }
  return JSON.stringify(safe);
}

export const auditService = {
  async log(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entity: params.entity,
          entityId: String(params.entityId),
          oldValues: sanitize(params.oldValues),
          newValues: sanitize(params.newValues),
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log entry:', error);
      return null;
    }
  },
};
