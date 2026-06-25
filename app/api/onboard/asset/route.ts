// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// PATCH /api/onboard/asset?id=<asset_id>   Body: { token, label?, page_position?, rank? }
// DELETE /api/onboard/asset?id=<asset_id>  Body: { token }
//
// Tenant boundary: the asset's client_id must match the client identified
// by the token. Storage object is also deleted on DELETE.

import { createServiceClient } from '@/lib/db/supabase-service';

async function resolveAssetOwner(supabase: ReturnType<typeof createServiceClient>, token: string, assetId: string) {
  const { data: client } = await supabase.from('clients').select('id').eq('resume_token', token).maybeSingle();
  if (!client) return { error: 'Invalid token', status: 404 as const };
  const { data: asset } = await supabase
    .from('client_assets')
    .select('id, client_id, file_url')
    .eq('id', assetId)
    .maybeSingle();
  if (!asset) return { error: 'Asset not found', status: 404 as const };
  if (asset.client_id !== client.id) return { error: 'Forbidden', status: 403 as const };
  return { client, asset };
}

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    const { token, label, page_position, rank } = body ?? {};
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const supabase = createServiceClient();
    const ownership = await resolveAssetOwner(supabase, token, id);
    if ('error' in ownership) return Response.json({ error: ownership.error }, { status: ownership.status });

    const patch: Record<string, unknown> = {};
    if (label !== undefined) patch.label = label;
    if (page_position !== undefined) patch.page_position = page_position || null;
    if (rank !== undefined) patch.rank = Number.isInteger(Number(rank)) ? Number(rank) : 0;

    if (Object.keys(patch).length === 0) return Response.json({ ok: true });

    const { data: updated, error } = await supabase
      .from('client_assets')
      .update(patch)
      .eq('id', id)
      .select('id, file_url, file_type, label, page_position, rank')
      .single();
    if (error) {
      console.error('[onboard/asset PATCH]', error.message);
      return Response.json({ error: 'Update failed' }, { status: 500 });
    }
    return Response.json({ ok: true, asset: updated });
  } catch (err: any) {
    console.error('[onboard/asset PATCH]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '');
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const supabase = createServiceClient();
    const ownership = await resolveAssetOwner(supabase, token, id);
    if ('error' in ownership) return Response.json({ error: ownership.error }, { status: ownership.status });

    // Remove storage object (best effort) — file_url is the public URL; derive
    // the object key by trimming the bucket public-prefix.
    try {
      const u = new URL(ownership.asset.file_url);
      // Public URL shape: /storage/v1/object/public/client-assets/<objectKey>
      const marker = '/client-assets/';
      const i = u.pathname.indexOf(marker);
      if (i >= 0) {
        const objectKey = u.pathname.slice(i + marker.length);
        await supabase.storage.from('client-assets').remove([objectKey]);
      }
    } catch (err) {
      console.warn('[onboard/asset DELETE] storage cleanup skipped:', err);
    }

    const { error: delErr } = await supabase.from('client_assets').delete().eq('id', id);
    if (delErr) {
      console.error('[onboard/asset DELETE]', delErr.message);
      return Response.json({ error: 'Delete failed' }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('[onboard/asset DELETE]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
