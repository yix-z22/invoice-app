CREATE TYPE invoice_status AS ENUM ('draft', 'issued');
ALTER TABLE invoices
  ADD COLUMN invoice_status invoice_status NOT NULL DEFAULT 'issued';