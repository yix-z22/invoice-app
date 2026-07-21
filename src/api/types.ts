export const DeliveryType = {
  Delivery: "delivery",
  Pickup: "self_pickup",
} as const;
export type DeliveryType = (typeof DeliveryType)[keyof typeof DeliveryType];

export const PaymentTerms = {
  SevenDays: "seven_days",
  COD: "cash_on_order",
} as const;
export type PaymentTerms = (typeof PaymentTerms)[keyof typeof PaymentTerms];

export const InvoiceStatus = {
  Draft: "draft",
  Issued: "issued",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const PaymentStatus = {
  Paid: "paid",
  Unpaid: "unpaid",
  Overdue: "overdue",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface Company {
  id: string;
  name: string;
  address: string | null;
  attn: string | null;
  notes: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  wechat: string | null;
  whatsapp: string | null;
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_no: number;
  our_ref_no: number;
  invoice_status: InvoiceStatus;
  contact_id: string | null;
  bill_to: string | null;
  deliver_to: string | null;
  attn: string | null;
  delivery_type: DeliveryType;
  po_number: string | null;
  po_date: string | null;
  invoice_date: string;
  payment_terms: PaymentTerms;
  remark: string | null;
  reference: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  paid_date: string | null;
  created_at: string;
  line_items?: LineItem[];
}

export interface LineItem {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface Setting {
  id: number;
  next_invoice_no: number;
  next_ref_no: number;
  updated_at: string;
}
