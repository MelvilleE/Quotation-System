"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createUnifiedExport,
  importLegacyExport,
  importUnifiedExport,
  isUnifiedDataExport,
  type LegacyLocalStorageExport,
} from "@/lib/quotation/storage";
import type { QuoteType } from "@/types/quotation";

export default function DataMigrationPanel() {
  const [type, setType] = useState<QuoteType>("extension");
  const [message, setMessage] = useState("");

  function exportCurrentData() {
    try {
      const backup = createUnifiedExport(type);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `quotation-${type}-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(
        `Exported ${backup.sections.length} sections, ${backup.products.length} products, ${backup.quotes.length} saved quotes and ${backup.folders.length} folders for ${type}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage("Export failed. No data was changed.");
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;

      if (isUnifiedDataExport(parsed)) {
        const result = importUnifiedExport(type, parsed);
        setMessage(
          `Restored ${result.sections} sections, ${result.products} products, ${result.quotes} saved quotes, ${result.folders} folders and ${result.logos} logos into ${type}.`,
        );
        return;
      }

      const result = importLegacyExport(type, parsed as LegacyLocalStorageExport);
      setMessage(
        `Imported legacy data: ${result.sections} sections, ${result.products} products and ${result.quotes} saved quotes into ${type}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage("Import failed. Please select a valid quotation-system JSON backup or an export from the original app.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Data Backup & Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Export a backup of the current unified data, or import an existing backup. Original Extension and Loft app exports are still supported for migration.
        </p>

        <div className="space-y-2">
          <Label>Quote type</Label>
          <Select value={type} onValueChange={(value) => { setType(value as QuoteType); setMessage(""); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extension">Extension</SelectItem>
              <SelectItem value="loft">Loft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Export current data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Downloads the selected quote type's sections, products, saved quotes, PDF text, financial settings and logos, plus the shared folders and editable company signature.
          </p>
          <Button className="mt-4" variant="outline" onClick={exportCurrentData}>
            <Download className="mr-2 h-4 w-4" />
            Export {type === "extension" ? "Extension" : "Loft"} Backup
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Import / restore data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A unified backup restores the selected quote type and its shared folder/signature settings. Legacy exports from the old apps can also be imported. Importing replaces the stored data for the selected quote type.
          </p>
          <input
            id="quotation-import-file"
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
          <Button asChild className="mt-4">
            <label htmlFor="quotation-import-file" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Choose Backup / Export File
            </label>
          </Button>
        </div>

        {message && <p className="text-sm font-medium">{message}</p>}
      </CardContent>
    </Card>
  );
}
