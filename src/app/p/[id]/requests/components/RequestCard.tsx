'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
    case 'reviewed':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">Reviewed</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20">Scheduled</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TimePreferenceText({ preference }: { preference: string }) {
  switch (preference) {
    case 'morning':
      return 'Por la Mañana';
    case 'afternoon':
      return 'Por la Tarde';
    case 'anytime':
      return 'Cualquier momento';
    default:
      return preference || 'No especificado';
  }
}

interface RequestCardProps {
  request: any;
  storageUrl: string;
}

export default function RequestCard({ request, storageUrl }: RequestCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <CardHeader className={cn(
          "pb-4 flex flex-row items-center justify-between",
          isOpen && "border-b border-border/50"
        )}>
          <div className="flex items-center gap-4">
            <div className="bg-white/50 p-2 rounded-lg border border-border/10">
               {isOpen ? <ChevronUp className="h-5 w-5 text-[#0D3B47]" /> : <ChevronDown className="h-5 w-5 text-[#0D3B47]" />}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-[#0D3B47]">Request #{request.id.split('-')[0]}</CardTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Created on {new Date(request.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </CardHeader>
      </button>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Details */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#0D3B47]/40 mb-3">Details</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-[#FDFCFB] p-4 rounded-xl border border-border/30">{request.details}</p>
                </div>
                {request.on_site_instructions && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0D3B47]/40 mb-3">Special Instructions</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-amber-50/30 p-4 rounded-xl border border-amber-200/50">{request.on_site_instructions}</p>
                  </div>
                )}
              </div>

              {/* Info sidebar */}
              <div className="space-y-4 bg-[#F4F2EC] p-5 rounded-2xl border border-[#E2E0D8]/50 h-fit">
                {request.schedule_date && (
                  <div className="flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <CalendarIcon className="h-4 w-4 text-[#306C3E]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proposed Date</p>
                      <p className="text-sm font-semibold text-[#0D3B47]">{new Date(request.schedule_date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                )}
                {request.time_preference && (
                  <div className="flex items-start gap-3 border-t border-[#E2E0D8]/30 pt-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Clock className="h-4 w-4 text-[#306C3E]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time Preference</p>
                      <p className="text-sm font-semibold text-[#0D3B47]"><TimePreferenceText preference={request.time_preference} /></p>
                    </div>
                  </div>
                )}
                {request.images && request.images.length > 0 && (
                  <div className="flex items-start gap-3 border-t border-[#E2E0D8]/30 pt-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <ImageIcon className="h-4 w-4 text-[#306C3E]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attached Images</p>
                      <p className="text-sm font-semibold text-[#0D3B47] text-nowrap">{request.images.length} photos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Images Preview if any */}
            {request.images && request.images.length > 0 && (
              <div className="mt-8 border-t border-border/30 pt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#0D3B47]/40 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Attached Images
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
                  {request.images.map((img: string, i: number) => {
                    const publicUrl = img.startsWith('http') ? img : `${storageUrl}/${img}`;
                    return (
                      <div key={i} className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-border/40 shadow-sm transition-transform hover:scale-105">
                        <img src={publicUrl} alt={`Attached ${i}`} className="w-full h-full object-cover" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
