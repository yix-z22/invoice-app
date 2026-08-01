import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getDistinctBillTo,
  getDistinctDeliverTo,
  getDistinctAttn,
  getDistinctReferences,
} from "../api/invoices";
import { getContacts } from "../api/contacts";
import type { Contact } from "../api/types";
import ComboField from "../components/ComboField";
import "./InvoiceForm.css";

interface LineItemDraft {
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
}

const emptyLine: LineItemDraft = {
  description: "",
  qty: 1,
  unit: "pc",
  unit_price: 0,
};

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [saving, setSaving] = useState(false);

  // Invoice header fields
  const [contactId, setContactId] = useState("");
  const [billTo, setBillTo] = useState("");
  const [deliverTo, setDeliverTo] = useState("");
  const [attn, setAttn] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("seven_days");
  const [remark, setRemark] = useState("");
  const [reference, setReference] = useState("");

  // Line items
  const [lines, setLines] = useState<LineItemDraft[]>([{ ...emptyLine }]);

  // ComboField
  const [billToOptions, setBillToOptions] = useState<string[]>([]);
  const [deliverToOptions, setDeliverToOptions] = useState<string[]>([]);
  const [attnOptions, setAttnOptions] = useState<string[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<string[]>([]);

  useEffect(() => {
    getContacts().then(setContacts);
    getDistinctBillTo().then(setBillToOptions);
    getDistinctDeliverTo().then(setDeliverToOptions);
    getDistinctAttn().then(setAttnOptions);
    getDistinctReferences().then(setReferenceOptions);
  }, []);

  useEffect(() => {
    if (!id) return;

    getInvoice(id).then((inv) => {
      setContactId(inv.contact_id ?? "");
      const match = contacts.find((c) => c.id === inv.contact_id);
      if (match) setContactSearch(match.name);
      setBillTo(inv.bill_to ?? "");
      setDeliverTo(inv.deliver_to ?? "");
      setAttn(inv.attn ?? "");
      setDeliveryType(inv.delivery_type);
      setPoNumber(inv.po_number ?? "");
      setPoDate(inv.po_date ?? "");
      setInvoiceDate(inv.invoice_date);
      setPaymentTerms(inv.payment_terms);
      setRemark(inv.remark ?? "");
      setReference(inv.reference ?? "");

      if (inv.line_items && inv.line_items.length > 0) {
        setLines(
          inv.line_items
            .sort((a, b) => a.position - b.position)
            .map((li) => ({
              description: li.description,
              qty: li.qty,
              unit: li.unit,
              unit_price: li.unit_price,
            })),
        );
      }
    });
  }, [id]);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()),
  );

  function selectContact(c: Contact) {
    setContactId(c.id);
    setContactSearch(c.name);
    setShowContacts(false);

    // Auto-fill from most recent invoice for this contact
    getDistinctBillTo(c.id).then((opts) => {
      setBillToOptions(opts);
      if (opts.length === 1) setBillTo(opts[0]);
    });
    getDistinctDeliverTo(c.id).then((opts) => {
      setDeliverToOptions(opts);
      if (opts.length === 1) setDeliverTo(opts[0]);
    });
    getDistinctAttn(c.id).then((opts) => {
      setAttnOptions(opts);
      if (opts.length === 1) setAttn(opts[0]);
    });
  }

  function updateLine(
    index: number,
    field: keyof LineItemDraft,
    value: string | number,
  ) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function lineAmount(line: LineItemDraft) {
    return line.qty * line.unit_price;
  }

  const grandTotal = lines.reduce((sum, l) => sum + lineAmount(l), 0);

  async function handleSave(status: "draft" | "issued") {
    setSaving(true);
    try {
      const data = {
        contact_id: contactId || null,
        bill_to: billTo || null,
        deliver_to: deliverTo || null,
        attn: attn || null,
        delivery_type: deliveryType as "delivery" | "self_pickup",
        po_number: poNumber || null,
        po_date: poDate || null,
        invoice_date: invoiceDate || new Date().toISOString().slice(0, 10),
        payment_terms: paymentTerms as "seven_days" | "cash_on_order",
        remark: remark || null,
        reference: reference || null,
        invoice_status: status,
        payment_status: "unpaid" as const,
        due_date: null,
        paid_date: null,
      };

      const lineItems = lines
        .filter((l) => l.description.trim() !== "")
        .map((l, i) => ({
          position: i + 1,
          description: l.description,
          qty: l.qty,
          unit: l.unit,
          unit_price: l.unit_price,
          amount: l.qty * l.unit_price,
        }));

      if (isEdit && id) {
        await updateInvoice(id, data, lineItems);
      } else {
        await createInvoice(data, lineItems);
      }

      navigate("/invoices");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Delete this invoice?")) return;
    await deleteInvoice(id);
    navigate("/invoices");
  }

  return (
    <div className="invoice-form">
      <h1>{isEdit ? "Edit Invoice" : "New Invoice"}</h1>

      <div className="form-grid">
        <div className="form-group combo-field">
          <label>Contact</label>
          <input
            value={contactSearch}
            onChange={(e) => {
              setContactSearch(e.target.value);
              setContactId("");
              setShowContacts(true);
            }}
            onFocus={() => setShowContacts(true)}
            onBlur={() => setShowContacts(false)}
            placeholder="Type to search..."
          />
          {showContacts && filteredContacts.length > 0 && (
            <ul className="combo-list">
              {filteredContacts.map((c) => (
                <li key={c.id} onMouseDown={() => selectContact(c)}>
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ComboField
          label="Bill To"
          value={billTo}
          onChange={setBillTo}
          options={billToOptions}
          placeholder="Type or select…"
        />

        <ComboField
          label="Deliver To"
          value={deliverTo}
          onChange={setDeliverTo}
          options={deliverToOptions}
          placeholder="Type or select…"
        />

        <ComboField
          label="Attn"
          value={attn}
          onChange={setAttn}
          options={attnOptions}
          placeholder="Type or select…"
        />

        <div className="form-group">
          <label>Delivery Type</label>
          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
          >
            <option value="delivery">Delivery</option>
            <option value="self_pickup">Self Pickup</option>
          </select>
        </div>

        <div className="form-group">
          <label>PO Number</label>
          <input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>PO Date</label>
          <input
            type="date"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Payment Terms</label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          >
            <option value="seven_days">7 Days</option>
            <option value="cash_on_order">Cash on Order</option>
          </select>
        </div>

        <ComboField
          label="Reference"
          value={reference}
          onChange={setReference}
          options={referenceOptions}
          placeholder="Type or select…"
        />

        <div className="form-group full">
          <label>Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </div>

      <h2>Line Items</h2>
      <table className="line-items">
        <thead>
          <tr>
            <th>#</th>
            <th className="col-desc">Description</th>
            <th className="col-qty">Qty</th>
            <th className="col-unit">Unit</th>
            <th className="col-price">Unit Price</th>
            <th className="col-amount">Amount</th>
            <th className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={line.qty}
                  onChange={(e) => updateLine(i, "qty", Number(e.target.value))}
                />
              </td>
              <td>
                <input
                  value={line.unit}
                  onChange={(e) => updateLine(i, "unit", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) =>
                    updateLine(i, "unit_price", Number(e.target.value))
                  }
                />
              </td>
              <td className="amount-cell">{lineAmount(line).toFixed(2)}</td>
              <td>
                <button
                  className="btn-sm"
                  onClick={() => removeLine(i)}
                  type="button"
                >
                  x
                </button>
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={5} style={{ textAlign: "right" }}>
              Total
            </td>
            <td className="amount-cell">{grandTotal.toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <button className="btn-sm btn-add-row" onClick={addLine} type="button">
        + Add Row
      </button>

      <div className="form-actions">
        <button
          className="btn-save"
          onClick={() => handleSave("draft")}
          disabled={saving}
        >
          Save Draft
        </button>
        <button
          className="btn-save"
          onClick={() => handleSave("issued")}
          disabled={saving}
        >
          Issue
        </button>
        {isEdit && (
          <button className="btn-delete" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
