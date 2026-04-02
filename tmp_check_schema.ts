import { createClient } from './src/lib/supabase/server.ts';

async function test() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('job_expenses').select('*').limit(1);
  console.log(JSON.stringify(data?.[0] || {}, null, 2));
}

test();
