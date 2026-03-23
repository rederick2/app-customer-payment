'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

export function ImportQuotesModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ total: number; success: number; errors: number; details?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus(null);
    }
  };

  const parseLineItems = (itemsStr: string, proformaId: string) => {
    if (!itemsStr) return [];

    const items: any[] = [];
    const regex = /(.*?)\s*\((\d+),\s*\$([\d.]+)\)/g;
    let match;

    while ((match = regex.exec(itemsStr)) !== null) {
      let description = match[1].trim();
      // Remove leading comma and space if present
      if (description.startsWith(',')) {
        description = description.substring(1).trim();
      }

      const quantity = parseInt(match[2], 10);
      const unit_price = parseFloat(match[3]);
      const total_price = quantity * unit_price;

      items.push({
        proforma_id: proformaId,
        description,
        quantity,
        unit_price,
        total_price,
      });
    }

    return items;
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
        let errorDetails: string[] = [];

        // Pre-fetch all clients to avoid finding them one by one
        const { data: existingClients, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, email');

        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
        }

        const clientsList = existingClients || [];

        for (const row of rows) {
          try {
            const quoteNumber = row['Quote #'] || null;
            const clientName = row['Client name'] || '';
            const clientEmail = row['Client email'] || '';
            const clientPhone = row['Client phone'] || '';
            const projectName = row['Title'] || `Job - ${clientName}`;
            const statusRaw = row['Status'] || '';

            // Map Jobber Status to app Status if needed
            let status = 'draft';
            const s = statusRaw.toLowerCase();
            if (s.includes('awaiting response') || s.includes('sent')) status = 'sent';
            else if (s.includes('approved') || s.includes('converted')) status = 'approved';
            else if (s.includes('archived')) status = 'rejected';

            const subtotal = parseFloat(row['Subtotal ($)'] || '0');
            const total = parseFloat(row['Total ($)'] || '0');
            const discountRaw = parseFloat(row['Discount ($)'] || '0');
            const collectedDeposit = parseFloat(row['Collected deposit ($)'] || '0');
            const requiredDeposit = parseFloat(row['Required deposit ($)'] || '0');
            
            const tax = total - subtotal + discountRaw; // Total = Subtotal + Tax - Discount => Tax = Total - Subtotal + Discount
            
            const adjustments = [];
            if (discountRaw > 0) {
              adjustments.push({
                id: crypto.randomUUID(),
                label: 'Descuento',
                type: 'discount',
                valueType: 'amount',
                value: discountRaw
              });
            }
            if (tax > 0) {
              adjustments.push({
                id: crypto.randomUUID(),
                label: 'Impuesto Importado',
                type: 'tax',
                valueType: 'amount',
                value: tax
              });
            }

            // Dates processing (if needed for valid_until)
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 30); // Default validity

            // 1. Resolve Client
            let clientId: string | null = null;

            // Try to find exact match by email or name
            const matchedClient = clientsList.find(c => {
              if (clientEmail && c.email) {
                const searchEmail = clientEmail.toLowerCase().trim();

                // Separamos por coma, limpiamos espacios de cada uno y buscamos el exacto
                return c.email.toLowerCase().split(',')
                  .map((email: string) => email.trim())
                  .includes(searchEmail);
              }
              return false;
            });

            if (matchedClient) {
              clientId = matchedClient.id;
            } else if (clientName) {
              // Create new client
              const { data: newClient, error: newClientError } = await supabase
                .from('clients')
                .insert({
                  name: clientName,
                  email: clientEmail || null,
                  phone: clientPhone || null
                })
                .select('id')
                .single();

              if (newClientError) throw new Error(`Client creation failed: ${newClientError.message}`);
              if (newClient) {
                clientId = newClient.id;
                clientsList.push({ id: newClient.id, name: clientName, email: clientEmail }); // Add to cache
              }
            }

            if (!clientId) {
              throw new Error(`Could not resolve or create client for quote ${quoteNumber}`);
            }

            // 2. Create Proforma (Quote)
            const { data: newProforma, error: proformaError } = await supabase
              .from('proformas')
              .insert({
                client_id: clientId,
                project_name: projectName,
                status: status,
                subtotal: subtotal,
                tax: tax > 0 ? tax : 0,
                total: total,
                adjustments: adjustments,
                deposit_amount: collectedDeposit,
                required_deposit: requiredDeposit,
                valid_until: validUntil.toISOString().split('T')[0]
              })
              .select('id')
              .single();

            if (proformaError) throw new Error(`Proforma creation failed: ${proformaError.message}`);

            if (newProforma) {
              // 3. Create Line Items
              const lineItemsStr = row['Line items'] || '';
              const itemsToInsert = parseLineItems(lineItemsStr, newProforma.id);

              if (itemsToInsert.length > 0) {
                const { error: itemsError } = await supabase
                  .from('proforma_items')
                  .insert(itemsToInsert);

                if (itemsError) throw new Error(`Items creation failed: ${itemsError.message}`);
              }
            }

            successCount++;
          } catch (err: any) {
            console.error('Error row processing:', err);
            errorCount++;
            errorDetails.push(`Quote ${row['Quote #'] || 'N/A'}: ${err.message}`);
          }
        }

        setImportStatus({
          total: rows.length,
          success: successCount,
          errors: errorCount,
          details: errorDetails
        });
        setIsImporting(false);

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
      <Button variant="outline" className="gap-2 bg-white text-primary border-primary hover:bg-muted" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Importar CSV
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Quotes / Proformas</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con tus quotes para importarlas masivamente. Se intentará vincular al cliente existente o se creará uno nuevo.
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
                    <p className="font-medium">Haz clic para seleccionar un archivo</p>
                    <p className="text-sm text-muted-foreground">O arrastra un archivo .csv aquí</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 border rounded-md space-y-3 bg-muted/20">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Resumen de Importación
                </h4>
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between"><span>Total procesadas:</span> <span className="font-medium">{importStatus.total}</span></li>
                  <li className="flex justify-between text-green-600"><span>Exitosas:</span> <span className="font-medium">{importStatus.success}</span></li>
                  {importStatus.errors > 0 && (
                    <li className="flex justify-between text-red-600"><span>Errores:</span> <span className="font-medium">{importStatus.errors}</span></li>
                  )}
                </ul>
                {importStatus.errors > 0 ? (
                  <div className="mt-2 bg-orange-50 p-3 rounded border border-orange-200">
                    <div className="flex items-start gap-2 text-sm text-orange-700 font-medium mb-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>Se encontraron errores ({importStatus.errors}):</p>
                    </div>
                    <ul className="text-xs text-orange-600 space-y-1 pl-6 list-disc max-h-32 overflow-y-auto">
                      {importStatus.details?.map((det, idx) => (
                        <li key={idx}>{det}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    La importación se completó sin errores.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose} disabled={isImporting}>
              {importStatus ? "Cerrar" : "Cancelar"}
            </Button>
            {!importStatus && (
              <Button onClick={processImport} disabled={!file || isImporting} className="gap-2">
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Iniciar Importación"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
