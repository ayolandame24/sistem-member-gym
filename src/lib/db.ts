/**
 * db.ts — Lapisan akses data ke Supabase.
 * Semua operasi CRUD terpusat di sini agar mudah diuji dan diubah.
 */
import { supabase, supabaseConfigured } from './supabase';

/** Lempar error jika Supabase belum dikonfigurasi — hooks akan fallback ke data lokal */
function assertConfigured() {
  if (!supabaseConfigured) {
    throw new Error('Supabase not configured');
  }
}
import type {
  MemberRow,
  InvoiceRow,
  PaymentRow,
  SubscriptionRow,
  MonthlyRevenueRow,
} from './database.types';
import type {
  Member,
  Invoice,
  Payment,
  Subscription,
  MonthRevenue,
} from '@/data/types';

// ── Helpers: konversi snake_case DB ↔ camelCase App ──────────────────────────

function rowToMember(r: MemberRow): Member {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    plan: r.plan,
    monthlyFee: r.monthly_fee,
    joinDate: r.join_date,
    startDate: r.start_date,
    expiryDate: r.expiry_date,
    status: r.status,
    avatarColor: r.avatar_color,
  };
}

function memberToRow(m: Omit<Member, 'id'> & { id?: string }): MemberRow['Insert'] {
  return {
    id: m.id ?? crypto.randomUUID(),
    code: m.code,
    name: m.name,
    email: m.email,
    phone: m.phone,
    plan: m.plan,
    monthly_fee: m.monthlyFee,
    join_date: m.joinDate,
    start_date: m.startDate,
    expiry_date: m.expiryDate,
    status: m.status,
    avatar_color: m.avatarColor,
  };
}

function rowToInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    number: r.number,
    memberId: r.member_id,
    memberName: r.member_name,
    plan: r.plan,
    period: r.period,
    amount: r.amount,
    dueDate: r.due_date,
    status: r.status,
    issuedDate: r.issued_date,
  };
}

function invoiceToRow(inv: Omit<Invoice, 'id'> & { id?: string }): InvoiceRow['Insert'] {
  return {
    id: inv.id ?? crypto.randomUUID(),
    number: inv.number,
    member_id: inv.memberId,
    member_name: inv.memberName,
    plan: inv.plan,
    period: inv.period,
    amount: inv.amount,
    due_date: inv.dueDate,
    status: inv.status,
    issued_date: inv.issuedDate,
  };
}

function rowToPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    date: r.date,
    memberId: r.member_id,
    memberName: r.member_name,
    invoiceNumber: r.invoice_number,
    amount: r.amount,
    method: r.method,
    status: r.status,
  };
}

function paymentToRow(p: Omit<Payment, 'id'> & { id?: string }): PaymentRow['Insert'] {
  return {
    id: p.id ?? crypto.randomUUID(),
    date: p.date,
    member_id: p.memberId,
    member_name: p.memberName,
    invoice_number: p.invoiceNumber,
    amount: p.amount,
    method: p.method,
    status: p.status,
  };
}

function rowToSubscription(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    memberId: r.member_id,
    memberName: r.member_name,
    plan: r.plan,
    monthlyFee: r.monthly_fee,
    nextBillingDate: r.next_billing_date,
    status: r.status,
    startDate: r.start_date,
  };
}

function subscriptionToRow(s: Omit<Subscription, 'id'> & { id?: string }): SubscriptionRow['Insert'] {
  return {
    id: s.id ?? crypto.randomUUID(),
    member_id: s.memberId,
    member_name: s.memberName,
    plan: s.plan,
    monthly_fee: s.monthlyFee,
    next_billing_date: s.nextBillingDate,
    status: s.status,
    start_date: s.startDate,
  };
}

function rowToMonthRevenue(r: MonthlyRevenueRow): MonthRevenue {
  return { month: r.month, revenue: r.revenue, recognized: r.recognized };
}

// ── Members ───────────────────────────────────────────────────────────────────

export const db = {
  members: {
    async getAll(): Promise<Member[]> {
      assertConfigured();
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as MemberRow[]).map(rowToMember);
    },

    async insert(m: Member): Promise<Member> {
      assertConfigured();
      const { data, error } = await supabase
        .from('members')
        .insert(memberToRow(m))
        .select()
        .single();
      if (error) throw error;
      return rowToMember(data as MemberRow);
    },

    async update(id: string, changes: Partial<Omit<Member, 'id'>>): Promise<Member> {
      assertConfigured();
      const partial: Partial<MemberRow['Update']> = {};
      if (changes.name !== undefined) partial.name = changes.name;
      if (changes.email !== undefined) partial.email = changes.email;
      if (changes.phone !== undefined) partial.phone = changes.phone;
      if (changes.plan !== undefined) partial.plan = changes.plan;
      if (changes.monthlyFee !== undefined) partial.monthly_fee = changes.monthlyFee;
      if (changes.joinDate !== undefined) partial.join_date = changes.joinDate;
      if (changes.startDate !== undefined) partial.start_date = changes.startDate;
      if (changes.expiryDate !== undefined) partial.expiry_date = changes.expiryDate;
      if (changes.status !== undefined) partial.status = changes.status;
      if (changes.avatarColor !== undefined) partial.avatar_color = changes.avatarColor;

      const { data, error } = await supabase
        .from('members')
        .update(partial)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToMember(data as MemberRow);
    },

    async delete(id: string): Promise<void> {
      assertConfigured();
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // ── Invoices ───────────────────────────────────────────────────────────────

  invoices: {
    async getAll(): Promise<Invoice[]> {
      assertConfigured();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as InvoiceRow[]).map(rowToInvoice);
    },

    async insert(inv: Invoice): Promise<Invoice> {
      assertConfigured();
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceToRow(inv))
        .select()
        .single();
      if (error) throw error;
      return rowToInvoice(data as InvoiceRow);
    },

    async update(id: string, changes: Partial<Pick<Invoice, 'status' | 'dueDate' | 'period'>>): Promise<Invoice> {
      assertConfigured();
      const partial: Partial<InvoiceRow['Update']> = {};
      if (changes.status !== undefined) partial.status = changes.status;
      if (changes.dueDate !== undefined) partial.due_date = changes.dueDate;
      if (changes.period !== undefined) partial.period = changes.period;

      const { data, error } = await supabase
        .from('invoices')
        .update(partial)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToInvoice(data as InvoiceRow);
    },

    async delete(id: string): Promise<void> {
      assertConfigured();
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // ── Payments ───────────────────────────────────────────────────────────────

  payments: {
    async getAll(): Promise<Payment[]> {
      assertConfigured();
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as PaymentRow[]).map(rowToPayment);
    },

    async insert(p: Payment): Promise<Payment> {
      assertConfigured();
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentToRow(p))
        .select()
        .single();
      if (error) throw error;
      return rowToPayment(data as PaymentRow);
    },
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────

  subscriptions: {
    async getAll(): Promise<Subscription[]> {
      assertConfigured();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as SubscriptionRow[]).map(rowToSubscription);
    },

    async insert(s: Subscription): Promise<Subscription> {
      assertConfigured();
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionToRow(s))
        .select()
        .single();
      if (error) throw error;
      return rowToSubscription(data as SubscriptionRow);
    },

    async update(id: string, changes: Partial<Pick<Subscription, 'status' | 'nextBillingDate'>>): Promise<Subscription> {
      assertConfigured();
      const partial: Partial<SubscriptionRow['Update']> = {};
      if (changes.status !== undefined) partial.status = changes.status;
      if (changes.nextBillingDate !== undefined) partial.next_billing_date = changes.nextBillingDate;

      const { data, error } = await supabase
        .from('subscriptions')
        .update(partial)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToSubscription(data as SubscriptionRow);
    },
  },

  // ── Monthly Revenue ────────────────────────────────────────────────────────

  monthlyRevenue: {
    async getAll(): Promise<MonthRevenue[]> {
      assertConfigured();
      const { data, error } = await supabase
        .from('monthly_revenue')
        .select('*')
        .order('year', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return (data as MonthlyRevenueRow[]).map(rowToMonthRevenue);
    },
  },
};
