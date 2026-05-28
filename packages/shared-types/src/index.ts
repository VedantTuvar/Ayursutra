export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  DOCTOR = 'DOCTOR',
  THERAPIST = 'THERAPIST',
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
  PATIENT = 'PATIENT'
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE'
}

export enum InventoryCategory {
  OIL = 'OIL',
  GHEE = 'GHEE',
  HERB = 'HERB',
  MEDICINE = 'MEDICINE',
  EQUIPMENT = 'EQUIPMENT',
  CONSUMABLE = 'CONSUMABLE',
  OTHER = 'OTHER'
}

export enum TransactionType {
  STOCK_IN = 'STOCK_IN',
  CONSUMED = 'CONSUMED',
  ADJUSTED = 'ADJUSTED',
  EXPIRED = 'EXPIRED',
  RETURNED = 'RETURNED'
}

// Common interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiErrorPayload;
}

export interface PaginationMeta {
  totalCount: number;
  limit: number;
  cursor?: string;
  hasNextPage: boolean;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: any;
}
