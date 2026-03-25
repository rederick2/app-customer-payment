import { NextRequest, NextResponse } from 'next/server';
import { uploadToFtp } from '@/lib/ftp';
import { createAdminClient } from '@/lib/supabase/admin';
import path from 'path';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/tasks/[id]/media ─────────────────────────────────────────────────
// Returns all media rows for a given task
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: taskId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('task_media')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ media: data });
}

// ── POST /api/tasks/[id]/media ────────────────────────────────────────────────
// Accepts multipart/form-data: file, proforma_id, caption?
export async function POST(req: NextRequest, { params }: Params) {
  const { id: taskId } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const proformaId = formData.get('proforma_id') as string | null;
  const caption = (formData.get('caption') as string | null) || '';

  if (!file || !proformaId) {
    return NextResponse.json({ error: 'file and proforma_id are required' }, { status: 400 });
  }

  // Determine media type
  const isVideo = file.type.startsWith('video/');
  const mediaType = isVideo ? 'video' : 'image';

  // Build a unique filename preserving the extension
  const ext = path.extname(file.name) || (isVideo ? '.mp4' : '.jpg');
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const subDir = `task-media/${taskId}`;

  // Convert File → Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let publicUrl: string;
  try {
    publicUrl = await uploadToFtp(buffer, uniqueName, subDir);
  } catch (err: any) {
    console.error('[Task Media] FTP upload failed:', err.message);
    return NextResponse.json({ error: `FTP upload failed: ${err.message}` }, { status: 500 });
  }

  // Store the record in Supabase
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('task_media')
    .insert({
      task_id: taskId,
      proforma_id: proformaId,
      url: publicUrl,
      type: mediaType,
      caption,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ media: data }, { status: 201 });
}
