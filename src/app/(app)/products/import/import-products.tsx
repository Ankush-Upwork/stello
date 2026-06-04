"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  bulkCreateProducts,
  type BulkImportResult,
} from "@/app/(app)/products/import/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildProductTemplateCsv, parseCsv } from "@/lib/csv";

export function ImportProducts() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [rows, setRows] = React.useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<BulkImportResult | null>(null);

  function downloadTemplate() {
    const blob = new Blob([buildProductTemplateCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sello-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setResult(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error("That file has no data rows.");
        return;
      }
      if (!("product_name" in parsed[0])) {
        toast.error("Missing a 'product_name' column. Use the template.");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch {
      toast.error("Could not read that file. Please upload a .csv.");
    }
  }

  async function runImport() {
    if (!rows) return;
    setImporting(true);
    try {
      const res = await bulkCreateProducts(rows);
      setResult(res);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Imported ${res.inserted} product${res.inserted === 1 ? "" : "s"}.`);
        router.refresh();
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1 · Download the template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Fill one product per row. Keep the header row. Leave optional columns
            blank. Save as CSV.
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download CSV template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2 · Upload your file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Choose CSV file
          </Button>

          {rows && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{fileName}</p>
              <p className="text-muted-foreground">
                {rows.length} row{rows.length === 1 ? "" : "s"} ready to import
              </p>
              <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-muted-foreground">
                {rows.slice(0, 12).map((r, i) => (
                  <li key={i} className="truncate">
                    • {r.product_name || "(no name)"}
                    {r.size || r.color ? ` — ${[r.size, r.color].filter(Boolean).join(" / ")}` : ""}
                  </li>
                ))}
                {rows.length > 12 && <li>…and {rows.length - 12} more</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {rows && (
        <Button size="lg" className="w-full" onClick={runImport} disabled={importing}>
          {importing ? <Loader2 className="animate-spin" /> : <Upload />}
          {importing ? "Importing…" : `Import ${rows.length} products`}
        </Button>
      )}

      {result && (
        <Card>
          <CardContent className="space-y-2 py-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> {result.inserted} imported
            </p>
            {result.skippedForLimit > 0 && (
              <p className="text-amber-600">
                {result.skippedForLimit} skipped — plan product limit reached.{" "}
                <a href="/pricing" className="underline">Upgrade</a>
              </p>
            )}
            {result.failed.length > 0 && (
              <div className="text-destructive">
                <p>{result.failed.length} row(s) had problems:</p>
                <ul className="mt-1 max-h-32 list-inside list-disc overflow-y-auto">
                  {result.failed.slice(0, 10).map((f) => (
                    <li key={f.line}>Row {f.line}: {f.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="mt-2">
              <a href="/products">View products</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
