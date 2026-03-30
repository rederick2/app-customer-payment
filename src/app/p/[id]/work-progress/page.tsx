import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import WorkProgressGallery from './WorkProgressGallery';
import { Camera } from 'lucide-react';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

export default async function PublicWorkProgressPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch proforma and its user branding
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      users (display_name, logo_url)
    `)
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    notFound();
  }

  // Fetch task media for Work Progress gallery
  const { data: taskMediaRows } = await supabase
    .from('task_media')
    .select('*, job_tasks(title)')
    .eq('proforma_id', id)
    .order('created_at', { ascending: true });

  // Group media by task
  const mediaByTask: Record<string, { taskTitle: string; items: any[] }> = {};
  for (const row of taskMediaRows || []) {
    const taskTitle = row.job_tasks?.title || 'Task';
    if (!mediaByTask[row.task_id]) {
      mediaByTask[row.task_id] = { taskTitle, items: [] };
    }
    mediaByTask[row.task_id].items.push(row);
  }

  const userData = (Array.isArray(proforma.users) ? proforma.users[0] : proforma.users) as any;

  return (
    <div className="px-6 py-8 md:p-12 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header section with context */}
      <div className="mb-10 text-center sm:text-left transition-all">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-[#E2E0D8] pb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 mb-2">
              <Camera className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Updates</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#0D3B47] tracking-tight">
              Work Progress
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Real-time documentation of the progress for <span className="text-foreground font-bold">"{proforma.project_name}"</span>. 
              Scroll through photos and videos from completed milestones.
            </p>
          </div>
          
          {userData?.logo_url && (
            <div className="hidden sm:block">
              <img src={userData.logo_url} alt="Logo" className="h-16 w-auto opacity-80 grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
          )}
        </div>
      </div>

      <WorkProgressGallery mediaByTask={mediaByTask} />
    </div>
  );
}
