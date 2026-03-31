'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadToFtp, deleteFromFtp } from '@/lib/ftp';

export async function uploadProjectPhoto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const file = formData.get('file') as File;
  const proformaId = formData.get('proforma_id') as string | null;
  const caption = formData.get('caption') as string | null;
  const overlayText = formData.get('overlay_text') as string | null;
  const isPublic = formData.get('is_public') === 'true';

  if (!file || file.size === 0) return { error: 'No file provided' };

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const subDir = `gallery/${user.id}`;
  const storagePath = `${subDir}/${fileName}`;

  // Convert File to Buffer for FTP upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let publicUrl: string;
  try {
    publicUrl = await uploadToFtp(buffer, fileName, subDir);
  } catch (err: any) {
    return { error: `FTP Upload failed: ${err.message}` };
  }

  const { data: photo, error: dbError } = await supabase
    .from('project_photos')
    .insert({
      proforma_id: proformaId || null,
      user_id: user.id,
      storage_path: storagePath,
      url: publicUrl,
      caption: caption || null,
      overlay_text: overlayText || null,
      is_public: isPublic,
    })
    .select()
    .single();

  if (dbError) return { error: dbError.message };

  if (proformaId) revalidatePath(`/proforma/${proformaId}`);
  revalidatePath('/gallery');

  return { success: true, photo };
}

export async function updateProjectPhoto(
  photoId: string,
  updates: { caption?: string; overlay_text?: string; is_public?: boolean; tags?: string[] }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('project_photos')
    .update(updates)
    .eq('id', photoId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/gallery');
  return { success: true };
}

export async function deleteProjectPhoto(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: photo } = await supabase
    .from('project_photos')
    .select('storage_path, proforma_id')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single();

  if (!photo) return { error: 'Photo not found' };

  // Extract fileName and subDir from storage_path for deletion
  const pathParts = photo.storage_path.split('/');
  const fileName = pathParts.pop()!;
  const subDir = pathParts.join('/');

  try {
    await deleteFromFtp(fileName, subDir);
  } catch (err: any) {
    console.error(`[Gallery] Failed to delete from FTP: ${err.message}`);
  }

  const { error } = await supabase
    .from('project_photos')
    .delete()
    .eq('id', photoId);

  if (error) return { error: error.message };

  if (photo.proforma_id) revalidatePath(`/proforma/${photo.proforma_id}`);
  revalidatePath('/gallery');
  return { success: true };
}

export async function getGalleryPhotos(proformaId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('project_photos')
    .select('*, proformas(id, project_name, number)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (proformaId) query = query.eq('proforma_id', proformaId);

  const { data } = await query;
  return data || [];
}
