'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, X, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { submitServiceRequest } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ServiceRequestForm({ proformaId, clientName }: { proformaId: string, clientName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  
  // Image handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<{file: File, preview: string}[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      
      if (selectedImages.length + newFiles.length > 10) {
        toast.error('Límite de imágenes', { description: 'Solo puedes subir un máximo de 10 imágenes.'});
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
    selectedImages.forEach((img) => {
      formData.append('images', img.file);
    });

    const result = await submitServiceRequest(proformaId, formData);
    
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Solicitud enviada', {
        description: 'Hemos recibido tu solicitud exitosamente. Nos pondremos en contacto pronto.',
      });
      router.push(`/p/${proformaId}`);
    } else {
      toast.error('Error al enviar', {
        description: result.error,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      
      {/* Overview */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Resumen del Servicio</CardTitle>
          <p className="text-sm text-muted-foreground">Por favor, proporciona toda la información posible sobre lo que necesitas.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Detalles del Servicio *</label>
            <Textarea 
              name="details"
              placeholder="Describe el trabajo a realizar..." 
              required
              className="min-h-[140px] resize-y"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <label>Imágenes del trabajo a realizar</label>
              <span className="text-muted-foreground">{selectedImages.length}/10</span>
            </div>
            
            <div className="border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-medium">Click para agregar imágenes</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG hasta 10MB</p>
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
          <CardTitle className="text-xl">Evaluación en sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Instrucciones Especiales</label>
            <Textarea 
              name="onSiteInstructions"
              placeholder="¿Hay algo que debemos saber antes de visitar el lugar? (Ej: Código de puerta, cuidado con el perro, etc.)" 
              className="min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Agenda de Visita</CardTitle>
          <p className="text-sm text-muted-foreground">Selecciona el día y horario preferido para la evaluación en sitio.</p>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-8">
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Propuesta</label>
            <Popover>
              <PopoverTrigger>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background/50",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                  disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preferencia de Horario</label>
            <Select name="timePreference" defaultValue="anytime">
              <SelectTrigger className="w-full bg-background/50">
                <SelectValue placeholder="Selecciona un horario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Por la Mañana (8:00 AM - 12:00 PM)</SelectItem>
                <SelectItem value="afternoon">Por la Tarde (1:00 PM - 5:00 PM)</SelectItem>
                <SelectItem value="anytime">Cualquier momento del día</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pb-10">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="px-8" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
          ) : (
            'Aceptar Solicitud'
          )}
        </Button>
      </div>

    </form>
  );
}
