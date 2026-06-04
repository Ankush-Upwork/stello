/** Columns accepted in the product import template (order matters for the file). */
export const PRODUCT_IMPORT_COLUMNS = [
  "product_name",
  "category",
  "size",
  "color",
  "brand",
  "material",
  "sku",
  "barcode",
  "purchase_price",
  "selling_price",
  "quantity",
  "low_stock_threshold",
  "supplier_name",
  "supplier_phone",
  "status",
] as const;

const EXAMPLE_ROW: Record<string, string> = {
  product_name: "Cotton Anarkali Kurti",
  category: "Kurti",
  size: "L",
  color: "Red",
  brand: "Biba",
  material: "Cotton",
  sku: "KUR-001",
  barcode: "",
  purchase_price: "500",
  selling_price: "1200",
  quantity: "10",
  low_stock_threshold: "3",
  supplier_name: "Surat Textiles",
  supplier_phone: "9876500000",
  status: "active",
};

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The downloadable template: header row + one example row. */
export function buildProductTemplateCsv(): string {
  const header = PRODUCT_IMPORT_COLUMNS.join(",");
  const example = PRODUCT_IMPORT_COLUMNS.map((c) => csvCell(EXAMPLE_ROW[c] ?? "")).join(",");
  return `${header}\n${example}\n`;
}

/** Split CSV text into rows of fields (handles quotes, commas, newlines). */
function csvToRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

/** Parse CSV text into row objects keyed by the header row. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = csvToRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
}
