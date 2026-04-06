'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, X, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { submitServiceRequest } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image-compression';

export default function ServiceRequestForm({ proformaId, clientName }: { proformaId: string, clientName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();

  // Image handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<{ file: File, preview: string }[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));

      if (selectedImages.length + newFiles.length > 10) {
        toast.error('Límite de imágenes', { description: 'Solo puedes subir un máximo de 10 imágenes.' });
        return;
      }

      const newImages = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Add date correctly
    if (date) {
      // Date in YYYY-MM-DD
      formData.set('scheduleDate', format(date, 'yyyy-MM-dd'));
    }

    // Add images manually
    if (selectedImages.some(img => img.file.size > 5 * 1024 * 1024)) {
      toast.info('Compressing images...', { duration: 3000 });
    }

    for (const img of selectedImages) {
      let fileToUpload = img.file;
      if (fileToUpload.size > 5 * 1024 * 1024) {
        fileToUpload = (await compressImage(fileToUpload, 4.5)) as File;
      }
      formData.append('images', fileToUpload);
    }

    const result = await submitServiceRequest(proformaId, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Service request sent', {
        description: 'We have received your request successfully. We will contact you soon.',
      });
      router.push(`/p/${proformaId}`);
    } else {
      toast.error('Error sending request', {
        description: result.error,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">

      {/* Overview */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Service Details</CardTitle>
          <p className="text-sm text-muted-foreground">Please provide all the information possible about what you need.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Service Details *</label>
            <Textarea
              name="details"
              placeholder="Describe the work to be done..."
              required
              className="min-h-[140px] resize-y"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <label>Images of the work to be done</label>
              <span className="text-muted-foreground">{selectedImages.length}/10</span>
            </div>

            <div className="border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-medium">Click to add images</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG up to 10MB</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
              />
            </div>

            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* On-site assessment */}
      <Card className="border-border/50 shadow-sm relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">On-site assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Special Instructions</label>
            <Textarea
              name="onSiteInstructions"
              placeholder="Is there anything we should know before visiting the site? (Ex: Door code, beware of dog, etc.)"
              className="min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Schedule</CardTitle>
          <p className="text-sm text-muted-foreground">Select the preferred day and time for the on-site assessment.</p>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-8">

          <div className="flex flex-col space-y-2">
            <label htmlFor="proposed-date" className="text-sm font-semibold text-foreground/90">
              Proposed Date
            </label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    id="proposed-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal transition-all duration-200",
                      "border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {date ? (
                      <span className="font-medium text-foreground">
                        {format(date, 'PPP', { locale: enUS })}
                      </span>
                    ) : (
                      <span>Select a date</span>
                    )}
                  </Button>
                }
              />
              <PopoverContent
                className="w-auto p-0 shadow-lg border-border rounded-xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={enUS}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label htmlFor="proposed-date" className="text-sm font-semibold text-foreground/90">
              Time Preference
            </label>
            <Select name="timePreference" defaultValue="anytime">
              <SelectTrigger className="w-full bg-background/50">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (1:00 PM - 5:00 PM)</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pb-10">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" className="px-8" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            'Accept Request'
          )}
        </Button>
      </div>

    </form>
  );
}
