import { NextRequest, NextResponse } from 'next/server';
import { uploadToFtp } from '@/lib/ftp';

/**
 * POST /api/upload
 * Accepts a multipart FormData with a single 'file' field.
 * Uploads directly to the FTP root folder (storage_app).
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string | null) || undefined;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await uploadToFtp(buffer, fileName, folder);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('FTP upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed.' }, { status: 500 });
  }
}
