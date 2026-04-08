'use server';

import { createClient } from '@/lib/supabase/server';
import { generateVisitDates, ScheduleConfig } from '@/lib/job-scheduling';
import { revalidatePath } from 'next/cache';

export async function generateAndSaveVisits(
  proformaId: string,
  jobStartAt: string,
  jobEndAt: string | null,
  recurringInterval: string,
  scheduleConfig: ScheduleConfig,
  teamMembers: any[]
) {
  const supabase = await createClient();

  // 1. Generate dates using the new signature
  const visitDates = generateVisitDates(jobStartAt, jobEndAt, recurringInterval, scheduleConfig);
  if (visitDates.length === 0) return { success: true, count: 0 };

  // 2. Prepare visit records
  const assignedName = scheduleConfig.assignedTeamMembers
    .map(id => teamMembers.find(m => m.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const primaryAssignedTo = scheduleConfig.assignedTeamMembers[0] || null;

  const visitsToInsert = visitDates.map(date => ({
    proforma_id: proformaId,
    visit_date: date.toISOString(),
    assigned_to: primaryAssignedTo,
    assigned_name: assignedName,
    status: 'scheduled',
    notes: scheduleConfig.visitInstructions || null
  }));

  const { error } = await supabase
    .from('job_visits')
    .insert(visitsToInsert);

  if (error) {
    console.error('Error creating job visits:', error);
    return { error: 'Failed to create visits' };
  }

  revalidatePath(`/proforma/${proformaId}`);
  return { success: true, count: visitDates.length };
}
