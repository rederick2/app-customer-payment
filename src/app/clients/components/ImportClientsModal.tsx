'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

export function ImportClientsModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ total: number; success: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus(null);
    }
  };

  const processImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let successCount = 0;
        let errorCount = 0;

        // Limit import to a manageable batch size
        const BATCH_SIZE = 50;
        
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const formattedBatch = batch.map(row => {
            // Collect custom fields
            const customFields: Record<string, any> = {};
            Object.keys(row).forEach(key => {
              if (key.startsWith('CFT[') || key.startsWith('CFL[')) {
                customFields[key] = row[key];
              }
            });

            // Helper function to parse booleans
            const parseBool = (val: string, defaultVal = false) => {
              if (val === 'true' || val === 'TRUE' || val === '1') return true;
              if (val === 'false' || val === 'FALSE' || val === '0') return false;
              return defaultVal;
            };

            return {
              import_id: row['J-ID'] || null,
              is_company: parseBool(row['Is Company?']),
              display_name: row['Display Name'] || null,
              company_name: row['Company Name'] || null,
              title: row['Title'] || null,
              first_name: row['First Name'] || null,
              last_name: row['Last Name'] || null,
              email: row['E-mails'] || null,
              phone: row['Main Phone #s'] || null,
              tags: row['Tags'] || null,
              
              // Billing
              billing_street_1: row['Billing Street 1'] || null,
              billing_street_2: row['Billing Street 2'] || null,
              billing_city: row['Billing City'] || null,
              billing_state: row['Billing State'] || null,
              billing_zip_code: row['Billing Zip code'] || null,
              billing_country: row['Billing Country'] || null,

              // Service (mapped to primary address fields)
              street_1: row['Service Street 1'] || null,
              street_2: row['Service Street 2'] || null,
              city: row['Service City'] || null,
              province: row['Service State'] || null,
              postal_code: row['Service Zip code'] || null,
              country: row['Service Country'] || null,

              // Phones
              work_phone: row['Work Phone #s'] || null,
              mobile_phone: row['Mobile Phone #s'] || null,
              home_phone: row['Home Phone #s'] || null,
              fax_phone: row['Fax Phone #s'] || null,
              other_phones: row['Other Phone #s'] || null,
              text_message_enabled_phone: row['Text Message Enabled Phone #'] || null,

              // Preferences
              receives_automatic_visit_reminders: parseBool(row['Receives automatic visit reminders?'], true),
              receives_automatic_job_follow_ups: parseBool(row['Receives automatic job follow-ups?'], true),
              receives_automatic_quote_follow_ups: parseBool(row['Receives automatic quote follow-ups?'], true),
              receives_automatic_invoice_follow_ups: parseBool(row['Receives automatic invoice follow-ups?'], true),
              archived: parseBool(row['Archived'], false),
              
              lead_source: row['Lead Source'] || null,
              custom_fields: Object.keys(customFields).length > 0 ? customFields : null
            };
          });

          const { error } = await supabase
            .from('clients')
            .upsert(formattedBatch, { onConflict: 'import_id' }); // assuming import_id is UNIQUE to avoid dupes

          if (error) {
            console.error('Error batch inserting clients:', error);
            errorCount += formattedBatch.length;
          } else {
            successCount += formattedBatch.length;
          }
        }

        setImportStatus({ total: rows.length, success: successCount, errors: errorCount });
        setIsImporting(false);
        
        if (errorCount === 0) {
          // alert(`Se han importado ${successCount} clientes exitosamente.`);
        }
        
        router.refresh();
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error: ' + error.message);
        setIsImporting(false);
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setFile(null);
      setImportStatus(null);
    }, 300);
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Upload a CSV file (Jobber format or other) to bulk import your clients.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!importStatus ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 border-muted-foreground/25 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              {file ? (
                <div className="text-center">
                  <p className="font-medium text-primary">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium">Click to select a file</p>
                  <p className="text-sm text-muted-foreground">Or drag a .csv file here</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 border rounded-md space-y-3 bg-muted/20">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Import Summary
              </h4>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between"><span>Total processed:</span> <span className="font-medium">{importStatus.total}</span></li>
                <li className="flex justify-between text-green-600"><span>Successful:</span> <span className="font-medium">{importStatus.success}</span></li>
                {importStatus.errors > 0 && (
                  <li className="flex justify-between text-red-600"><span>Errors:</span> <span className="font-medium">{importStatus.errors}</span></li>
                )}
              </ul>
              {importStatus.errors > 0 ? (
                 <div className="flex items-start gap-2 text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded border border-orange-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                     <p>There were some errors. Check the console for details. You may need to set up new columns in the database.</p>
                  </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Import completed without any retryable or ignorable errors.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isImporting}>
            {importStatus ? "Close" : "Cancel"}
          </Button>
          {!importStatus && (
            <Button onClick={processImport} disabled={!file || isImporting} className="gap-2">
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Start Import"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
