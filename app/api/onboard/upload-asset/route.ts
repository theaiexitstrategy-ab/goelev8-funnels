// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// POST /api/onboard/upload-asset (multipart/form-data)
//   Fields:
//     token         — resume token (identifies the client)
//     file          — the binary
//     label         — optional, e.g. "Hero Image"
//     page_position — optional: hero | about | services | gallery
//     rank          — optional integer
//
// Uploads the file to Supabase Storage at client-assets/<client_id>/<uuid>.<ext>
// and inserts a row in client_assets.

import { createServiceClient } from '@/lib/db/supabase-service';
import { randomUUID } from 'node:crypto';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get('token') || '');
    const file = form.get('file') as File | null;
    const label = (form.get('label') as string | null) ?? null;
    const page_position = (form.get('page_position') as string | null) ?? null;
    const rankRaw = form.get('rank');
    const rank = rankRaw != null ? Number(rankRaw) : 0;

    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });
    if (!file) return Response.json({ error: 'Missing file' }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return Response.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 413 });
    }

    const type = file.type || '';
    const isImage = type.startsWith('image/');
    const isVideo = type.startsWith('video/');
    if (!isImage && !isVideo) {
      return Response.json({ error: 'Only images and videos are supported' }, { status: 415 });
    }
    const file_type = isImage ? 'image' : 'video';

    const supabase = createServiceClient();
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('resume_token', token)
      .maybeSingle();
    if (!client) return Response.json({ error: 'Invalid token' }, { status: 404 });

    // Build a storage path: <client_id>/<uuid>.<ext>
    const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const objectKey = `${client.id}/${randomUUID()}${ext ? `.${ext}` : ''}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('client-assets')
      .upload(objectKey, buffer, { contentType: type, upsert: false });
    if (uploadErr) {
      console.error('[onboard/upload-asset] storage upload failed:', uploadErr.message);
      return Response.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from('client-assets').getPublicUrl(objectKey);

    const { data: inserted, error: insErr } = await supabase
      .from('client_assets')
      .insert({
        client_id: client.id,
        file_url: publicUrl.publicUrl,
        file_type,
        label,
        page_position: page_position || null,
        rank: Number.isInteger(rank) ? rank : 0,
        size_bytes: file.size,
      })
      .select('id, file_url, file_type, label, page_position, rank, uploaded_at')
      .single();

    if (insErr) {
      console.error('[onboard/upload-asset] insert client_assets failed:', insErr.message);
      return Response.json({ error: 'Could not record asset' }, { status: 500 });
    }

    return Response.json({ ok: true, asset: inserted });
  } catch (err: any) {
    console.error('[onboard/upload-asset]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
