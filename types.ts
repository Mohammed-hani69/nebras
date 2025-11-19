
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'installment';
export type MovementType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'initial' | 'adjustment';
export type ReturnReason = 'defective' | 'wrong_item' | 'customer_dissatisfaction' | 'other';

export type LeaveRequestType = 'annual' | 'sick' | 'unpaid' | 'other';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export type AdvanceStatus = 'unpaid' | 'paid';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave';
export type QuotationStatus = 'pending' | 'approved' | 'rejected' | 'invoiced';


export interface Product {
  id: string;
  name: string;
  category: 'موبايل' | 'إكسسوار';
  costPrice: number;
  sellPrice: number;
  initialQuantity: number;
  supplierId: string;
}

export interface InventoryMovement {
    id: string;
    date: string;
    productId: string;
    type: MovementType;
    quantity: number;
    referenceId?: string; // Invoice ID or PO ID
    notes?: string;
}

export interface CustomerTransaction {
  id: string;
  date: string; // ISO string
  type: 'payment' | 'debt';
  amount: number;
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  joinDate: string; // ISO string
  loyaltyPoints: number;
  transactions: CustomerTransaction[];
}

export interface Sale {
  invoiceId: string;
  date: string; // ISO string format
  productId: string;
  quantity: number;
  unitPrice: number;
  customerId: string | null;
  paymentMethod: PaymentMethod;
  // Extended properties for POS logic
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  quotationId?: string; // Link to the original quotation
  installmentDetails?: {
      downPayment: number;
      numberOfInstallments: number;
      interestRate: number; // as percentage
  };
}

export interface Service {
  orderId: string;
  date: string; // ISO string format
  description: string;
  revenue: number;
  partsCost: number;
  paymentMethod: PaymentMethod;
  customerId?: string | null;
  // Extended properties
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  quotationId?: string; // Link to the original quotation
  installmentDetails?: {
      downPayment: number;
      numberOfInstallments: number;
      interestRate: number; // as percentage
  };
}

export interface Expense {
  id: string;
  date: string; // ISO string format
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface Employee {
  id: string;
  username: string;
  password: string; // NOTE: In a real-world app, this should be hashed.
  roleId: string;
  // New comprehensive fields
  fullName: string;
  identityNumber?: string;
  address?: string;
  phone: string;
  hireDate: string; // ISO String
  baseSalary: number;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD format
    status: AttendanceStatus;
    deductionAmount: number;
    notes: string;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    leaveType: LeaveRequestType;
    startDate: string; // ISO String date only
    endDate: string; // ISO String date only
    reason: string;
    status: LeaveRequestStatus;
}

export interface Advance {
    id: string;
    employeeId: string;
    amount: number;
    date: string; // ISO String
    notes?: string;
    status: AdvanceStatus;
    payrollId?: string; // ID of the payroll this was deducted from
}

export interface PayrollDeduction {
    type: 'advance' | 'absence' | 'lateness' | 'other';
    amount: number;
    description: string;
    referenceId?: string; // advanceId or attendanceId
}

export interface Payroll {
    id: string;
    employeeId: string;
    monthYear: string; // Format: "YYYY-MM"
    baseSalary: number;
    bonuses: number;
    deductionDetails: PayrollDeduction[];
    totalDeductions: number;
    netSalary: number;
    status: 'pending' | 'paid';
    paymentDate?: string; // ISO String
}


export interface Payment {
  date: string; // ISO string format
  amount: number;
}

export interface AIMessage {
  id: string;
  content: string;
  timestamp: string; // ISO string
  read: boolean;
  feedback?: 'positive' | 'negative';
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseOrderPayment {
  id: string;
  date: string; // ISO string
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  date: string; // ISO string
  items: {
    productId: string;
    quantity: number;
    costPrice: number;
  }[];
  status: 'pending' | 'received';
  payments: PurchaseOrderPayment[];
}

export interface SaleReturn {
    id: string;
    originalSaleInvoiceId: string;
    date: string;
    productId: string;
    customerId: string | null;
    quantity: number;
    amountReturned: number;
    reason: ReturnReason;
}

export interface PurchaseReturn {
    id: string;
    supplierId: string;
    date: string;
    productId: string;
    quantity: number;
    amountRefunded: number;
    reason: ReturnReason;
    notes?: string;
}

export interface BillingSettings {
    storeName: string;
    taxNumber: string;
    taxRate: number;
    address: string;
    phone: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string; // Unique tax invoice number
    sourceId: string; // Sale.invoiceId or Service.orderId
    sourceType: 'sale' | 'service';
    date: string; // ISO string
    customerName: string;
    items: InvoiceItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    remainingBalance: number;
}

export interface Quotation {
    id: string;
    date: string;
    customerId: string | null;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
    subtotal: number;
    taxAmount: number;
    total: number;
    status: QuotationStatus;
    validUntil: string; // ISO String
}

export interface AISettings {
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  temperature: number;
  topK: number;
  topP: number;
  enableSuggestions: boolean;
  enableDashboardInsights: boolean;
  enableReportAnalysis: boolean;
  systemInstructions?: string;
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: string;
}

export interface ModuleDefinition {
    id: string;
    label: string;
    description: string; // Simple one-liner
    price: number;
    category: 'basic' | 'advanced' | 'premium';
    aiShortDescription?: string; // Generated catchy tagline
    aiLongDescription?: string; // Generated full detail
    icon?: string;
    isCore?: boolean; // If true, cannot be disabled/sold separately
}

export interface InstallmentPayment {
    id: string;
    dueDate: string; // ISO String
    amountDue: number;
    paidAmount: number;
    paymentDate: string | null; // ISO string if paid
    status: 'due' | 'paid' | 'overdue';
}

export interface InstallmentPlan {
    id: string;
    sourceId: string; // Sale or Service ID
    sourceType: 'sale' | 'service';
    customerId: string;
    totalFinancedAmount: number;
    totalRepaymentAmount: number;
    interestRate: number;
    numberOfInstallments: number;
    installmentAmount: number;
    startDate: string; // ISO String
    payments: InstallmentPayment[];
}

export interface HRSettings {
    workingDays: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[];
    officialCheckInTime: string; // "HH:MM" format, e.g., "09:00"
    absenceDeductionMethod: 'daily_rate' | 'manual';
}


export interface Store {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  subscriptionStartDate: string; // ISO string format
  subscriptionEndDate: string; // ISO string format
  subscriptionMonthlyPrice: number;
  storeType: string;
  enabledModules: string[];
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  sales: Sale[];
  services: Service[];
  expenses: Expense[];
  employees: Employee[];
  roles: CustomRole[];
  paymentHistory: Payment[];
  aiMessages: AIMessage[];
  aiInstructions?: string; // Specific instructions for this store
  billingSettings: BillingSettings;
  invoices: Invoice[];
  inventoryMovements: InventoryMovement[];
  saleReturns: SaleReturn[];
  purchaseReturns: PurchaseReturn[];
  activityLogs: ActivityLog[];
  installmentPlans: InstallmentPlan[];
  quotations: Quotation[];
  attendance: AttendanceRecord[];
  payrolls: Payroll[];
  leaves: LeaveRequest[];
  advances: Advance[];
  hrSettings: HRSettings;
}
