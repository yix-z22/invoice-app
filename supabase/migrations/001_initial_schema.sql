-- SDP4U Invoice App - Initial Schema
CREATE TYPE delivery_type AS ENUM ('delivery', 'self_pickup');
CREATE TYPE payment_terms AS ENUM ('seven_days', 'cash_on_order');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'overdue');

-- ============================================================
-- 1. COMPANIES TABLE
-- ============================================================
CREATE TABLE companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  address         text,
  attn            text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. CONTACTS TABLE
-- ============================================================
CREATE TABLE contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES companies(id),
  name        text NOT NULL,
  email       text,
  phone       text,
  wechat      text,
  whatsapp    text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INVOICES TABLE
-- ============================================================
CREATE TABLE invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no      int NOT NULL UNIQUE,
  our_ref_no      int NOT NULL,
  contact_id      uuid REFERENCES contacts(id),
  bill_to         text,
  deliver_to      text,
  attn            text,
  delivery_type   delivery_type NOT NULL DEFAULT 'delivery',
  po_number       text,
  po_date         date,
  invoice_date    date NOT NULL DEFAULT CURRENT_DATE,
  payment_terms   payment_terms NOT NULL DEFAULT 'seven_days',
  remark          text,
  reference       text,
  due_date        date,           -- auto-set from invoice_date + terms; manually overridable
  payment_status  payment_status NOT NULL DEFAULT 'unpaid',
  paid_date       date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. LINE_ITEMS TABLE
-- ============================================================
CREATE TABLE line_items(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position    int NOT NULL,
  description text NOT NULL,
  qty         numeric NOT NULL DEFAULT 0,
  unit        text NOT NULL DEFAULT 'pc',
  unit_price  numeric NOT NULL DEFAULT 0,
  amount      numeric NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. SETTINGS TABLE
-- ============================================================
CREATE TABLE settings (
  id              int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  next_invoice_no int NOT NULL DEFAULT 99999,  -- set correctly at import time
  next_ref_no     int NOT NULL DEFAULT 99999,   -- set correctly at import time
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings(id) VALUES (1);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONTACTS ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access" ON companies
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access" ON contacts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access" ON line_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_line_items_invoice_id ON line_items(invoice_id);