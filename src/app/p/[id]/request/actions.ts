'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function submitServiceRequest(proformaId: string, formData: FormData) {
  try {
    const supabase = createAdminClient();

    // Extraer datos del formulario
    const details = formData.get('details') as string;
    const onSiteInstructions = formData.get('onSiteInstructions') as string;
    const scheduleDate = formData.get('scheduleDate') as string;
    const timePreference = formData.get('timePreference') as string;
    
    // Obtener imágenes (pueden ser múltiples)
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: string[] = [];

    if (!details || details.trim() === '') {
      return { success: false, error: 'Por favor, proporciona los detalles del servicio.' };
    }

    // Subir imágenes al bucket
    for (const file of imageFiles) {
      if (file.size === 0) continue;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${proformaId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('request-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue; // Try with the next one
      }

      const { data: { publicUrl } } = supabase.storage
        .from('request-images')
        .getPublicUrl(filePath);

      imageUrls.push(publicUrl);
    }

    // Inserción en la base de datos
    const { error: insertError } = await supabase
      .from('service_requests')
      .insert({
        proforma_id: proformaId,
        details: details.trim(),
        on_site_instructions: onSiteInstructions ? onSiteInstructions.trim() : null,
        schedule_date: scheduleDate || null,
        time_preference: timePreference || null,
        images: imageUrls
      });

    if (insertError) {
      console.error('Error inserting service request:', insertError);
      return { success: false, error: 'Ocurrió un error al guardar la solicitud. ' + insertError.message };
    }

    // Actualizar vista
    revalidatePath(`/p/${proformaId}`);
    
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error submitting service request:', err);
    return { success: false, error: 'Error inesperado.' };
  }
}
