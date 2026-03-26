import { createAdminClient } from './src/lib/supabase/admin';

async function listTables() {
  const supabase = createAdminClient();
  
  // Query to list all tables in the public schema
  const { data, error } = await supabase.rpc('get_tables_info');
  
  if (error) {
    // If RPC is not available, try a raw query or just check if 'invoices' specifically exists
    const { error: invoiceError } = await supabase.from('invoices').select('id').limit(1);
    if (invoiceError) {
      console.log('Invoices table does NOT exist or is not accessible:', invoiceError.message);
    } else {
      console.log('Invoices table EXISTS.');
    }
    
    // Check proformas table as well to compare
    const { error: proformaError } = await supabase.from('proformas').select('id').limit(1);
    if (!proformaError) console.log('Proformas table EXISTS.');
    
    return;
  }
  
  console.log('Tables:', data);
}

listTables();
