const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const res = {
    users: users.users.map(u => ({ id: u.id, email: u.email })),
    team_members: null,
    error: null
  };

  const { data, error } = await supabase.from('team_members').select('*');
  res.team_members = data;
  if (error) res.error = error;

  fs.writeFileSync('.scripts/out2.json', JSON.stringify(res, null, 2), 'utf8');
}
test();
