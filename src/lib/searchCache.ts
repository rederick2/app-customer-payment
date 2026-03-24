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
  // Replace hyphens with spaces so 'rust-oleum' and 'rustoleum' split consistently
  return query.toLowerCase().trim().replace(/-/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Returns cached materials for (store, query), or null if not cached / expired.
 *
 * Phase 1 — Exact match: looks for a row with the exact normalized query key.
 * Phase 2 — Fuzzy match: if no exact match, searches inside ALL non-expired
 *   cached results for this store and returns products whose name or description
 *   contain at least one of the query words. This avoids hitting the scraping
 *   API for queries that are subsets or variations of already-cached searches.
 */
export async function getCached(
  store: string,
  query: string
): Promise<Material[] | null> {
  const normalized = normalizeQuery(query);

  // ── Phase 1: Exact key match ────────────────────────────────────────────
  const { data: exact } = await supabase
    .from('material_search_cache')
    .select('results, expires_at')
    .eq('store', store)
    .eq('query', normalized)
    .single();

  if (exact && new Date(exact.expires_at) > new Date()) {
    console.log(`[Cache HIT exact] ${store}: "${query}"`);
    return exact.results as Material[];
  }

  // ── Phase 2: Fuzzy search inside all cached results for this store ──────
  // Only consider words longer than 2 chars to avoid noise ("de", "el", etc.)
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return null;

  const { data: allEntries, error } = await supabase
    .from('material_search_cache')
    .select('results')
    .eq('store', store)
    .gt('expires_at', new Date().toISOString());

  if (error || !allEntries || allEntries.length === 0) return null;

  // Flatten all products from every cache entry and filter by query words
  const allProducts: Material[] = allEntries.flatMap(e => e.results as Material[]);

  const matched = allProducts.filter(product => {
    // Normalize hyphens in haystack too so 'Rust-Oleum' matches 'rustoleum' or 'rust oleum'
    const haystack = `${product.name} ${product.description ?? ''}`
      .toLowerCase()
      .replace(/-/g, ' ');
    return words.every(word => haystack.includes(word));
  });

  if (matched.length > 0) {
    console.log(`[Cache HIT fuzzy] ${store}: "${query}" — ${matched.length} product(s) found in existing cache`);
    return matched.slice(0, 15);
  }

  console.log(`[Cache MISS] ${store}: "${query}" — will scrape`);
  return null;
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
