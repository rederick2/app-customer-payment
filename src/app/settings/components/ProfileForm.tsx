'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from '../actions';
import { toast } from 'sonner';
import { Loader2, Camera, Trash2, Users, ShieldCheck } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { compressImage } from '@/lib/image-compression';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

export default function ProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [address, setAddress] = useState(initialData?.address || '');
  const [pdfFontSize, setPdfFontSize] = useState(initialData?.pdf_font_size || 10);
  
  const [showClientNameToWorkers, setShowClientNameToWorkers] = useState(initialData?.show_client_name_to_workers !== false);
  const [showClientPhoneToWorkers, setShowClientPhoneToWorkers] = useState(initialData?.show_client_phone_to_workers !== false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('address', address); // Ensure we use the autocomplete value
    formData.set('showClientNameToWorkers', String(showClientNameToWorkers));
    formData.set('showClientPhoneToWorkers', String(showClientPhoneToWorkers));

    if (logoFile) {
      let fileToUpload = logoFile;
      if (fileToUpload.size > 5 * 1024 * 1024) {
        toast.info('Compressing logo...', { duration: 2000 });
        fileToUpload = (await compressImage(fileToUpload, 4.5)) as File;
      }
      formData.append('logoFile', fileToUpload);
    } else if (!logoPreview && initialData?.logo_url) {
      formData.append('removeLogo', 'true');
    }

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handlePlaceSelected = (place: any) => {
    const formattedAddress = place.formatted_address || place.name;
    setAddress(formattedAddress);
  };

  return (
    <Card className="border-border/50 rounded-xl">
      <CardHeader>
        <CardTitle className="">Profile Information</CardTitle>
        <CardDescription>
          Update your personal details that will appear on your proformas.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Logo Upload Section */}
          <div className="space-y-4 pb-4 border-b border-border/50">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Company Logo</Label>
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 rounded-xl border-2 border-dashed border-border/40 bg-muted/20 flex items-center justify-center overflow-hidden group transition-all hover:border-primary/30">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-3" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all p-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-white hover:bg-card/20 transition-colors"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-white hover:bg-red-500/40 hover:text-red-200 transition-colors"
                        onClick={removeLogo}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground/30 hover:text-primary/40 transition-colors"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Camera className="h-8 w-8 stroke-[1.5px]" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Upload Logo</span>
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-foreground">Business Branding</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">This logo will provide a professional touch to all your estimates and invoices.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Display Name / Studio Name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={initialData?.display_name || ''}
                placeholder="e.g. Acme Design Studio"
                className="h-12 border-border/60 focus:border-primary/40 bg-background font-medium px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessLicense" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Business License / ID</Label>
              <Input
                id="businessLicense"
                name="businessLicense"
                defaultValue={initialData?.business_license || ''}
                placeholder="e.g. NJ LIC 13VH09087300"
                className="h-12 border-border/60 focus:border-primary/40 bg-background font-medium px-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Main Contact Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialData?.email || ''}
                placeholder="billing@yourcompany.com"
                className="h-12 border-border/60 focus:border-primary/40 bg-background font-medium px-4"
              />
              <p className="text-[10px] text-muted-foreground italic font-medium">
                This email replaces your login email on estimates and invoices.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialData?.phone || ''}
                placeholder="+1 (555) 000-0000"
                className="h-12 border-border/60 focus:border-primary/40 bg-background font-medium px-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pb-2">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Company Address (Google Search)</Label>
              <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                onPlaceSelected={handlePlaceSelected}
                options={{
                  types: ["address"],
                }}
                className="flex h-12 w-full rounded-md border border-border/60 bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Start typing your business address..."
                defaultValue={address}
                onChange={(e: any) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proformaSequenceStart" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Next Estimate Number (Starting Sequence)</Label>
            <Input
              id="proformaSequenceStart"
              name="proformaSequenceStart"
              type="number"
              min="1"
              defaultValue={initialData?.proforma_sequence_start || 1}
              placeholder="e.g. 100"
              className="h-12 border-border/60 focus:border-primary/40 bg-background font-medium px-4"
            />
            <p className="text-[10px] text-muted-foreground italic font-medium">
              Your next estimate will follow this sequence.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="termsConditions" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Default Terms & Conditions</Label>
            <Textarea
              id="termsConditions"
              name="termsConditions"
              defaultValue={initialData?.terms_conditions || ''}
              placeholder="e.g. This quote is valid for 30 days..."
              className="min-h-[120px] bg-background border-border/60 border-dashed focus:border-primary/30 text-sm leading-relaxed p-4 rounded-xl resize-none"
            />
          </div>

          {/* Team Privacy Settings */}
          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Team Privacy Settings</Label>
            </div>
            <p className="text-[11px] text-muted-foreground">Control what your team members can see in the team portal schedule.</p>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-3 p-3 rounded-xl border border-border/40 bg-muted/5">
                <Checkbox 
                  id="showClientNameToWorkers" 
                  checked={showClientNameToWorkers}
                  onCheckedChange={(checked) => setShowClientNameToWorkers(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="showClientNameToWorkers" className="text-sm font-bold cursor-pointer">Show client name to workers</Label>
                  <p className="text-[10px] text-muted-foreground">When disabled, workers will only see "Client" instead of the person/company name.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl border border-border/40 bg-muted/5">
                <Checkbox 
                  id="showClientPhoneToWorkers" 
                  checked={showClientPhoneToWorkers}
                  onCheckedChange={(checked) => setShowClientPhoneToWorkers(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="showClientPhoneToWorkers" className="text-sm font-bold cursor-pointer">Show client phone number to workers</Label>
                  <p className="text-[10px] text-muted-foreground">When disabled, the client's phone number and call button will be hidden from workers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label htmlFor="pdfFontSize" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">PDF Font Size</Label>
              <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                {pdfFontSize}px
              </span>
            </div>
            <div className="flex flex-col gap-6">
              <div className="px-2">
                <Slider
                  id="pdfFontSize"
                  name="pdfFontSize"
                  min={8}
                  max={16}
                  step={1}
                  value={[pdfFontSize]}
                  onValueChange={(values: number | readonly number[]) => {
                    const val = Array.isArray(values) ? values[0] : values;
                    setPdfFontSize(val as number);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 px-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Small (8px)</span>
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Normal (10px)</span>
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Large (16px)</span>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 p-4 md:p-8 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[10px] bg-primary/10 text-primary-foreground px-2 py-1 rounded-full font-bold uppercase tracking-widest">PDF Preview</div>
                </div>
                <div className="space-y-6 max-w-full md:max-w-md">
                  <div>
                    <h4 style={{ fontSize: `${Math.round(pdfFontSize * 1.6)}px`, fontWeight: 700 }} className="text-foreground transition-all duration-300">
                      Invoice #INV-0001
                    </h4>
                    <p style={{ fontSize: `${Math.round(pdfFontSize * 0.9)}px` }} className="text-muted-foreground/60 transition-all duration-300 mt-1">
                      Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p style={{ fontSize: `${pdfFontSize}px` }} className="text-foreground/80 leading-relaxed transition-all duration-300 font-medium">
                      This is a sample of how your item descriptions and notes will look in your generated PDFs.
                      You can adjust the slider above to reach the perfect legibility for your brand.
                    </p>
                    <div className="pt-4 border-t border-border/20">
                      <p style={{ fontSize: `${Math.round(pdfFontSize * 1.2)}px`, fontWeight: 600 }} className="text-foreground transition-all duration-300">
                        Total Amount: $1,250.00
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 pt-6 border-t border-border/50">
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-10 h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
          >
            {loading && <Loader2 className="mr-3 h-4 w-4 animate-spin" />}
            {loading ? 'Saving Changes...' : 'Save Profile Settings'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
