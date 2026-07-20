'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/lib/image-compression';

type ReceiptScannerProps = {
  proformaId?: string;
  onClose: () => void;
  onSuccess: (proformaId?: string) => void;
};

export default function ReceiptScanner({ proformaId, onClose, onSuccess }: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // For project/proforma selection when not provided
  const [selectedProformaId, setSelectedProformaId] = useState<string | null>(proformaId || null);
  const [proformas, setProformas] = useState<any[]>([]);
  const [isLoadingProformas, setIsLoadingProformas] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!proformaId) {
      const fetchProformas = async () => {
        setIsLoadingProformas(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('proformas')
            .select('id, project_name, number, status, clients ( name )')
            .eq('user_id', user.id)
            .eq('is_template', false)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setProformas(data || []);
        } catch (err: any) {
          toast.error('Error loading jobs/quotes: ' + err.message);
        } finally {
          setIsLoadingProformas(false);
        }
      };
      fetchProformas();
    }
  }, [proformaId, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpdateField = (field: string, value: string | number) => {
    setExtractedData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const processReceipt = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      let fileToUpload = file;
      
      // Compress if larger than 5MB
      if (fileToUpload.size > 5 * 1024 * 1024) {
        toast.info('Compressing receipt...', { duration: 2000 });
        fileToUpload = (await compressImage(fileToUpload, 4.5)) as File;
      }

      // 1. Upload to FTP
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', 'expenses');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const { url, error: uploadError } = await uploadRes.json();
      if (uploadError) throw new Error(uploadError);

      setImageUrl(url);
      setIsUploading(false);
      setIsProcessing(true);

      // 2. Call OCR API
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });

      const data = await ocrRes.json();
      if (data.error) throw new Error(data.error);

      setExtractedData(data);
    } catch (error: any) {
      toast.error('Error processing receipt', { description: error.message });
      setIsUploading(false);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSave = async () => {
    if (!extractedData) return;
    if (!selectedProformaId) {
      toast.error('Please select a project or quote first');
      return;
    }

    setIsUploading(true);
    const { error } = await supabase
      .from('job_expenses')
      .insert([{
        proforma_id: selectedProformaId,
        place: extractedData.place,
        description: extractedData.description,
        category: extractedData.category,
        amount: Number(extractedData.amount),
        date: extractedData.date || new Date().toISOString().split('T')[0],
        image_url: imageUrl,
        ocr_data: extractedData
      }]);

    if (error) {
      toast.error('Error saving expense');
    } else {
      toast.success('Expense saved successfully');
      onSuccess(selectedProformaId);
    }
    setIsUploading(false);
  };

  const selectedProforma = proformas.find(p => p.id === selectedProformaId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 font-manrope">
      <Card className="w-full max-w-lg shadow-2xl border-none max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-[#0D3B47] text-white rounded-t-xl flex flex-row items-center justify-between sticky top-0 z-10">
          <CardTitle className="text-lg flex items-center gap-2 font-archivo uppercase">
            Receipt Scanner
          </CardTitle>
          <Button variant="ghost" size="icon" className="text-white hover:bg-card/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Associate to Job/Quote Select Dropdown */}
          {!proformaId && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Associate to Job/Quote *</Label>
              {isLoadingProformas ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading projects...
                </div>
              ) : (
                <Select
                  value={selectedProformaId || ''}
                  onValueChange={(val) => setSelectedProformaId(val || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a job or quote...">
                      {selectedProforma ? (
                        `${selectedProforma.number ? `#${selectedProforma.number} - ` : ''}${selectedProforma.project_name || 'Unnamed Project'} ${selectedProforma.clients?.name ? `(${selectedProforma.clients.name})` : ''}`
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {proformas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.number ? `#${p.number} - ` : ''}{p.project_name || 'Unnamed Project'} {p.clients?.name ? `(${p.clients.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {!preview ? (
            <div className="grid grid-cols-1 gap-4">
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-[#306C3E]/40 hover:bg-[#306C3E]/5 transition-all cursor-pointer group"
                onClick={() => cameraInputRef.current?.click()}
              >
                <div className="h-12 w-12 bg-[#306C3E]/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="h-6 w-6 text-[#306C3E]" />
                </div>
                <p className="font-semibold text-foreground">Take Photo</p>
                <p className="text-xs text-muted-foreground mt-1">Use your mobile camera</p>
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                />
              </div>

              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-foreground">Upload from Gallery</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or saved files</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          ) : !extractedData ? (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="object-contain w-full h-full opacity-70" />
                {(isUploading || isProcessing) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white gap-3 backdrop-blur-[2px]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-bold tracking-widest uppercase text-xs">
                      {isUploading ? 'Uploading image...' : 'AI analyzing receipt...'}
                    </p>
                  </div>
                )}
              </div>
              {!isUploading && !isProcessing && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-primary" onClick={processReceipt}>
                    Process with AI
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <Check className="h-4 w-4" />
                  Verify and edit details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] uppercase text-emerald-600 font-bold font-manrope">Purchase Location</Label>
                    <Input
                      value={extractedData.place || ''}
                      onChange={(e) => handleUpdateField('place', e.target.value)}
                      className="bg-card border-emerald-100 focus-visible:ring-emerald-500 font-manrope"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-emerald-600 font-bold font-manrope">Total Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={extractedData.amount || ''}
                      onChange={(e) => handleUpdateField('amount', e.target.value)}
                      className="bg-card border-emerald-100 focus-visible:ring-emerald-500 font-bold text-[#306C3E] font-manrope"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-emerald-600 font-bold font-manrope">Date</Label>
                    <Input
                      type="date"
                      value={extractedData.date || ''}
                      onChange={(e) => handleUpdateField('date', e.target.value)}
                      className="bg-card border-emerald-100 focus-visible:ring-emerald-500 font-manrope"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-emerald-600 font-bold font-manrope">Category</Label>
                    <Input
                      value={extractedData.category || ''}
                      onChange={(e) => handleUpdateField('category', e.target.value)}
                      className="bg-card border-emerald-100 focus-visible:ring-emerald-500 font-manrope"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] uppercase text-emerald-600 font-bold font-manrope">Description</Label>
                    <Input
                      value={extractedData.description || ''}
                      onChange={(e) => handleUpdateField('description', e.target.value)}
                      className="bg-card border-emerald-100 focus-visible:ring-emerald-500 font-manrope"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setExtractedData(null)}>
                  Scan another
                </Button>
                <Button className="flex-1 bg-[#306C3E] hover:bg-[#265832]" onClick={confirmSave} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Save'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
