import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error(error)
  } else if (data && data.length > 0) {
    console.log(Object.keys(data[0]))
  } else {
    console.log('No entries found')
  }
}

test()
