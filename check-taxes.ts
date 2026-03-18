import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTaxes() {
  const { data, error } = await supabase.from('taxes').select('*')
  console.log('Taxes:', data)
  console.log('Error:', error)
}

checkTaxes()
