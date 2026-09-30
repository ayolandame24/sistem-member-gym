export type MembershipPlan = 'Basic' | 'Premium' | 'Elite' | 'Personal Trainer';
export type MembershipStatus = 'Active' | 'Expired' | 'Suspended';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue';
export type PaymentMethod = 'Transfer Bank' | 'Cash' | 'Debit Card' | 'QRIS' | 'E-Wallet';
export type RecurringStatus = 'Active' | 'Paused' | 'Cancelled';

export interface Member {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  plan: MembershipPlan;
  monthlyFee: number;
  joinDate: string; // ISO
  startDate: string; // ISO
  expiryDate: string; // ISO
  status: MembershipStatus;
  avatarColor: string;
}

export interface Invoice {
  id: string;
  number: string;
  memberId: string;
  memberName: string;
  plan: MembershipPlan;
  period: string; // e.g. "Sep 2026"
  amount: number;
  dueDate: string; // ISO
  status: PaymentStatus;
  issuedDate: string; // ISO
}

export interface Payment {
  id: string;
  date: string; // ISO
  memberId: string;
  memberName: string;
  invoiceNumber: string;
  amount: number;
  method: PaymentMethod;
  status: 'Success' | 'Pending' | 'Failed';
}

export interface Subscription {
  id: string;
  memberId: string;
  memberName: string;
  plan: MembershipPlan;
  monthlyFee: number;
  nextBillingDate: string; // ISO
  status: RecurringStatus;
  startDate: string; // ISO
}

export interface MonthRevenue {
  month: string; // e.g. "Jan"
  revenue: number;
  recognized: number;
}
