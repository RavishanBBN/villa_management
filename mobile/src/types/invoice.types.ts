export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'guest_invoice' | 'supplier_bill' | 'expense_receipt' | 'utility_bill' | 'other';
  reservationId?: string;
  expenseId?: string;
  issueDate: string;
  dueDate?: string;
  issuedTo: string;
  issuedToEmail?: string;
  issuedToAddress?: string;
  issuedFrom: string;
  issuedFromAddress?: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate?: number;
  lineItems: LineItem[];
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoicesState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
}

export interface GenerateInvoiceRequest {
  reservationId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
