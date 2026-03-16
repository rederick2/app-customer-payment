
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMoreTables() {
  const { data: tables, error } = await supabase.rpc('get_tables'); // This might not work if RPC is not defined
  
  // Fallback: try to select from likely table names
  const testTables = ['visits', 'time_entries', 'labor', 'job_visits', 'job_labor'];
  for (const table of testTables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table '${table}' exists:`, !error || error.code !== '42P01'); // 42P01 is undefined table
  }
}

checkMoreTables();
