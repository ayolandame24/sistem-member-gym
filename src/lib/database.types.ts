/**
 * Tipe yang dihasilkan dari skema Supabase.
 * Sesuaikan jika ada perubahan kolom di database.
 */
export type Database = {
  public: {
    Tables: {
      members: {
        Row: MemberRow;
        Insert: Omit<MemberRow, 'created_at'>;
        Update: Partial<Omit<MemberRow, 'id' | 'created_at'>>;
      };
      invoices: {
        Row: InvoiceRow;
        Insert: Omit<InvoiceRow, 'created_at'>;
        Update: Partial<Omit<InvoiceRow, 'id' | 'created_at'>>;
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, 'created_at'>;
        Update: Partial<Omit<PaymentRow, 'id' | 'created_at'>>;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Omit<SubscriptionRow, 'created_at'>;
        Update: Partial<Omit<SubscriptionRow, 'id' | 'created_at'>>;
      };
      monthly_revenue: {
        Row: MonthlyRevenueRow;
        Insert: Omit<MonthlyRevenueRow, 'id' | 'created_at'>;
        Update: Partial<Omit<MonthlyRevenueRow, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export interface MemberRow {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  plan: 'Basic' | 'Premium' | 'Elite' | 'Personal Trainer';
  monthly_fee: number;
  join_date: string;
  start_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired' | 'Suspended';
  avatar_color: string;
  created_at: string;
}

export interface InvoiceRow {
  id: string;
  number: string;
  member_id: string;
  member_name: string;
  plan: 'Basic' | 'Premium' | 'Elite' | 'Personal Trainer';
  period: string;
  amount: number;
  due_date: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  issued_date: string;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  date: string;
  member_id: string;
  member_name: string;
  invoice_number: string;
  amount: number;
  method: 'Transfer Bank' | 'Cash' | 'Debit Card' | 'QRIS' | 'E-Wallet';
  status: 'Success' | 'Pending' | 'Failed';
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  member_id: string;
  member_name: string;
  plan: 'Basic' | 'Premium' | 'Elite' | 'Personal Trainer';
  monthly_fee: number;
  next_billing_date: string;
  status: 'Active' | 'Paused' | 'Cancelled';
  start_date: string;
  created_at: string;
}

export interface MonthlyRevenueRow {
  id: number;
  month: string;
  revenue: number;
  recognized: number;
  year: number;
  created_at: string;
}
