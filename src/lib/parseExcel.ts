import * as XLSX from "xlsx";

export interface ParsedRow {
  invoice_no?: number;
  customer?: string;
  contact_person?: string;
  issue_date?: string;
  total_amount?: number;
  payment_received_date?: string;
  remarks?: string;
  our_ref_no?: number;
  raw_payment_date?: unknown;
  flags: string[];
}

export async function parseInvoiceExcel(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheet = workbook.Sheets["发票-收入"];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  const results: ParsedRow[] = [];
  let lastCustomer: string | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const invoiceNo = row[1] as number | null;
    if (!invoiceNo) continue;

    // forward-fill customer
    const customer = (row[2] as string | null) ?? lastCustomer ?? undefined;
    if (row[2]) lastCustomer = row[2] as string;

    const issueDate = row[4];
    const issueDateStr =
      issueDate instanceof Date
        ? issueDate.toISOString().split("T")[0]
        : undefined;

    const rawPayment = row[6];
    let payment_received_date: string | undefined;
    let paymentFlag: string | undefined;

    if (rawPayment instanceof Date) {
      payment_received_date = rawPayment.toISOString().split("T")[0];
    } else if (rawPayment !== null) {
      paymentFlag = `Payment date could not be read: "${String(rawPayment)}"`;
    }

    const flags: string[] = [];
    if (paymentFlag) flags.push(paymentFlag);
    if (!issueDateStr) flags.push("Issue date is missing");

    const rawRemarks = row[7];
    let our_ref_no: number | undefined;
    let remarks: string | undefined;

    if (
      typeof rawRemarks === "number" &&
      rawRemarks >= 21000000 &&
      rawRemarks <= 22000000
    ) {
      our_ref_no = rawRemarks;
    } else if (rawRemarks !== null) {
      remarks = String(rawRemarks);
    }

    const pr: ParsedRow = {
      invoice_no: invoiceNo,
      customer: customer,
      contact_person: (row[3] as string | null) ?? undefined,
      issue_date: issueDateStr,
      total_amount: (row[5] as number | null) ?? undefined,
      payment_received_date: payment_received_date,
      remarks: remarks,
      our_ref_no: our_ref_no,
      raw_payment_date: rawPayment ?? undefined,
      flags: flags,
    };

    results.push(pr);
  }

  return results;
}
