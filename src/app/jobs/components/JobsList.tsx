'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Search, ChevronLeft, ChevronRight, CalendarDays, MapPin, User, Clock, ArrowRight, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

interface JobsListProps {
  initialProformas: any[];
}

export function JobsList({ initialProformas }: JobsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Filtering
  const filteredProformas = initialProformas.filter(p =>
    p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.clients as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProformas.length / itemsPerPage);
  const paginatedProformas = filteredProformas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-bold text-3xl md:text-4xl font-bold tracking-tight mb-1">Jobs</h1>
          <p className="text-muted-foreground text-sm">List of all in-progress or scheduled jobs.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project or client..."
              className="pl-8 bg-background shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/jobs/new" className="w-full md:w-auto">
            <Button className="flex-1 sm:flex-initial gap-2">
              <PlusCircle className="h-4 w-4" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop View: Table */}
      <Card className="hidden md:block border-border/40 overflow-hidden bg-card/40 backdrop-blur-md rounded-2xl">
        <div className="overflow-x-auto">
          {filteredProformas.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase tracking-widest bg-muted/30 text-muted-foreground border-b border-border/40">
                <tr>
                  <th scope="col" className="px-6 py-5">Project</th>
                  <th scope="col" className="px-6 py-5">Client</th>
                  <th scope="col" className="px-6 py-5">Timeline</th>
                  <th scope="col" className="px-6 py-5">Status</th>
                  <th scope="col" className="px-6 py-5 text-right">Total</th>
                  <th scope="col" className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedProformas.map((proforma) => (
                  <tr
                    key={proforma.id}
                    className="group hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => router.push(`/proforma/${proforma.id}`)}
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{proforma.project_name}</p>
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter">REF: {proforma.number || proforma.id.split('-')[0]}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {((proforma.clients as any)?.name || 'C')[0]}
                        </div>
                        <span className="font-medium">{(proforma.clients as any)?.name || 'No Client'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          <span>{proforma.job_start_at ? format(new Date(proforma.job_start_at), 'MMM d, yyyy') : 'No set'}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{proforma.job_end_at ? format(new Date(proforma.job_end_at), 'MMM d, yyyy') : 'No set'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        proforma.status === 'job_terminated' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100'
                      )}>
                        {proforma.status === 'job_terminated' ? 'Terminated' : 'Active Job'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black tabular-nums text-foreground text-base">
                      ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-xl font-bold bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/proforma/${proforma.id}`);
                        }}
                      >
                        View Dashboard
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-20 w-20 text-muted/20 mb-4" />
              <p className="text-xl  italic text-muted-foreground/60">No matching jobs found.</p>
              {searchTerm && (
                <Button
                  variant="link"
                  className="mt-2 text-primary font-bold"
                  onClick={() => setSearchTerm('')}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pagination Footer (Desktop) */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between bg-muted/20">
            <div className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-foreground">{Math.min(filteredProformas.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProformas.length, currentPage * itemsPerPage)}</span> of <span className="text-foreground">{filteredProformas.length}</span> jobs
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className={cn("h-8 w-8 rounded-lg p-0 text-xs font-bold", currentPage === page ? 'bg-primary text-primary-foreground shadow-md' : '')}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4 pb-12">
        {filteredProformas.length > 0 ? (
          paginatedProformas.map((proforma) => (
            <div
              key={proforma.id}
              className="bg-card/60 border border-border/40 p-5 rounded-[0.98rem] shadow-sm active:scale-[0.98] transition-all"
              onClick={() => router.push(`/proforma/${proforma.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    proforma.status === 'job_terminated' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50 shadow-sm'
                  )}>
                    {proforma.status === 'job_terminated' ? 'Terminated' : 'Active Job'}
                  </span>
                  <h3 className="text-lg font-bold text-foreground leading-tight">{proforma.project_name}</h3>
                  <p className="text-[10px] font-black text-muted-foreground tracking-tighter uppercase opacity-60">REF: {proforma.number || proforma.id.split('-')[0]}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary leading-none">${proforma.total.toLocaleString('en-US')}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/30 p-2.5 rounded-[1.5rem] flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center text-primary shadow-inner">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Client</p>
                    <p className="text-xs font-bold text-foreground truncate">{(proforma.clients as any)?.name || 'No Client'}</p>
                  </div>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-[1.5rem] flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center text-primary shadow-inner">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Added</p>
                    <p className="text-xs font-bold text-foreground">{format(new Date(proforma.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-[1.5rem] border border-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Job Timeline</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">Start</span>
                    <span className="text-sm font-black text-foreground">{proforma.job_start_at ? format(new Date(proforma.job_start_at), 'MMM d') : '-'}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary/40 mx-2" />
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">Finish</span>
                    <span className="text-sm font-black text-foreground">{proforma.job_end_at ? format(new Date(proforma.job_end_at), 'MMM d') : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className=" italic opacity-60">No jobs found matching your criteria.</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-border/40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm font-bold">{currentPage}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-border/40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
