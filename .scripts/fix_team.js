require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: users } = await supabase.auth.admin.listUsers();
  
  // Find the real owner (Alexander or Rederick based on common usage)
  const owner = users.users.find(u => u.email === 'alexander_sz74@hotmail.com') 
             || users.users.find(u => u.email === 'rederick2@gmail.com');
  
  if (owner) {
     console.log("Restoring to owner:", owner.email, owner.id);
     // Re-assign all existing ones to this owner
     const { data, error } = await supabase
        .from('team_members')
        .update({ user_id: owner.id })
        .not('id', 'is', 'null');
        
     if (error) console.error("Error migrating:", error);
     else console.log("Success migration");
  } else {
     console.log("Owner not found");
  }
}
fix();
