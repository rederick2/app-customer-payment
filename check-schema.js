
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data: proforma, error: pError } = await supabase.from('proformas').select('*').limit(1);
  const { data: item, error: iError } = await supabase.from('proforma_items').select('*').limit(1);
  const { data: client, error: cError } = await supabase.from('clients').select('*').limit(1);

  console.log('Proforma keys:', proforma?.[0] ? Object.keys(proforma[0]) : 'None');
  console.log('Item keys:', item?.[0] ? Object.keys(item[0]) : 'None');
  console.log('Client keys:', client?.[0] ? Object.keys(client[0]) : 'None');
}

checkSchema();
