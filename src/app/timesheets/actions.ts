'use server';

import { createClient } from '@/lib/supabase/server';
import { QuickBooksClient } from '@/lib/quickbooks/client';
import { revalidatePath } from 'next/cache';

export async function fetchQBOEmployeesAndVendors() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const qbClient = await QuickBooksClient.fromUserId(user.id, supabase);
    const employees = await qbClient.getEmployees();
    const vendors = await qbClient.getVendors();

    return {
      success: true,
      data: {
        employees: employees.map((e: any) => ({ id: e.Id, name: e.DisplayName, type: 'Employee' })),
        vendors: vendors.map((v: any) => ({ id: v.Id, name: v.DisplayName, type: 'Vendor' }))
      }
    };
  } catch (err: any) {
    if (err.message.includes('not found or inactive')) {
      return { error: 'QuickBooks not connected' };
    }
    console.error('Failed to fetch from QBO:', err);
    return { error: 'Failed to fetch QuickBooks mappings' };
  }
}

export async function linkQBOTeamMember(teamMemberId: string, qboId: string, qboType: 'Employee' | 'Vendor') {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('team_members')
    .update({ 
      qbo_employee_id: qboId,
      qbo_employee_type: qboType
    })
    .eq('id', teamMemberId);

  if (error) return { error: 'Failed to save mapping' };
  
  revalidatePath('/timesheets');
  return { success: true };
}

export async function syncTimeEntryToQB(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Fetch the entry fully populated
  const { data: entry } = await supabase
    .from('time_entries')
    .select('*, team_members(*), proformas(*)')
    .eq('id', entryId)
    .single();

  if (!entry) return { error: 'Time entry not found' };
  if (!entry.team_members.qbo_employee_id) return { error: 'Team member not linked to QuickBooks' };
  if (!entry.end_time) return { error: 'Cannot sync an active time entry' };

  try {
    const qbClient = await QuickBooksClient.fromUserId(user.id, supabase);

    // Prepare time activity payload
    const totalMinutes = Math.floor(entry.duration_seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const date = new Date(entry.start_time).toISOString().split('T')[0];

    const timeActivityData: any = {
      nameOf: entry.team_members.qbo_employee_type || 'Employee', // Default to employee
      date: date,
      hours: hours,
      minutes: minutes,
      description: `Synced from App: ${entry.proformas?.project_name || 'General Work'}`
    };

    if (timeActivityData.nameOf === 'Employee') {
      timeActivityData.employeeRef = entry.team_members.qbo_employee_id;
    } else {
      timeActivityData.vendorRef = entry.team_members.qbo_employee_id;
    }

    // Attempt to map customer if proforma has external_id mapping (can skip for now or use if exists)
    // QuickBooks customer mapping usually lives in proformas.client_cache or a separate table.
    // For simplicity, we are logging time against the employee, we can omit CustomerRef if we don't have it explicitly bound.
    // However, if we do have it:
    if (entry.proformas?.external_id) {
       timeActivityData.customerRef = entry.proformas.external_id;
    }

    const res = await qbClient.createTimeActivity(timeActivityData);
    
    // Update our DB to mark as synced
    await supabase.from('time_entries').update({
      status: 'synced',
      qb_time_activity_id: res.TimeActivity?.Id
    }).eq('id', entry.id);

    revalidatePath('/timesheets');
    return { success: true };

  } catch (err: any) {
    console.error('QBO Sync Error:', err);
    return { error: err.message || 'Failed to sync to QuickBooks' };
  }
}
