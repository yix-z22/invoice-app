# Invoice App

An internal CRM and invoice tracker for a small business. Replaces manual spreadsheet workflows with a web app for managing companies, contacts, and invoices.

## Stack

- **React 19 + TypeScript** — frontend
- **Vite** — build tool / dev server
- **Supabase** (hosted Postgres) — database, no custom backend
- **i18next** — English / Chinese (Simplified) UI

## Status

Early development. Not deployed.

- [x] Database schema
- [x] TypeScript types (Company, Contact, Invoice, LineItem)
- [x] Companies API (CRUD + search)
- [ ] Contacts API
- [ ] Invoices API
- [ ] UI (all screens)
- [ ] Auth

## Local setup

1. Clone the repo
2. `npm install`
3. Create `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. `npm run dev`
