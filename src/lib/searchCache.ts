/**
 * Supabase-backed search cache for material scraping results.
 *
 * Table: material_search_cache
 *   store      text   — 'homedepot' | 'acehardware'
 *   query      text   — normalized (lowercase, trimmed)
 *   results    jsonb  — array of material objects
 *   expires_at timestamptz — created_at + TTL_DAYS
 */

import { supabase } from '@/lib/supabase';

const TTL_DAYS = 7;

type Material = {
  name: string;
  unit_price: number;
  photo_url: string;
  product_url: string;
  description: string;
};

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

/**
 * Returns cached materials for (store, query), or null if not cached / expired.
 */
export async function getCached(
  store: string,
  query: string
): Promise<Material[] | null> {
  const { data, error } = await supabase
    .from('material_search_cache')
    .select('results, expires_at')
    .eq('store', store)
    .eq('query', normalizeQuery(query))
    .single();

  if (error || !data) return null;

  // Check expiry
  if (new Date(data.expires_at) <= new Date()) {
    console.log(`[Cache EXPIRED] ${store}: "${query}"`);
    return null;
  }

  console.log(`[Cache HIT] ${store}: "${query}"`);
  return data.results as Material[];
}

/**
 * Upserts materials for (store, query) into the cache.
 */
export async function setCached(
  store: string,
  query: string,
  materials: Material[]
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);

  const { error } = await supabase
    .from('material_search_cache')
    .upsert(
      {
        store,
        query: normalizeQuery(query),
        results: materials,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'store,query' }
    );

  if (error) {
    console.error('[Cache] Error saving to Supabase:', error.message);
  } else {
    console.log(`[Cache SET] ${store}: "${query}" — expires ${expiresAt.toISOString()}`);
  }
}
