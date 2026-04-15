'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Search, ChevronLeft, ChevronRight, LayoutTemplate, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuotesListProps {
  initialProformas: any[];
}

export function QuotesList({ initialProformas }: QuotesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const [activeTab, setActiveTab] = React.useState('quotes');

  // Filtering based on search and tab
  const tabFilteredProformas = initialProformas.filter(p =>
    activeTab === 'templates' ? p.is_template : !p.is_template
  );

  const filteredProformas = tabFilteredProformas.filter(p =>
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-bold text-3xl md:text-4xl font-bold tracking-tight mb-1">Quotes</h1>
          <p className="text-muted-foreground text-sm">List of all quotes.</p>
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
          <div className="flex items-center gap-2">
            {/*<ImportQuotesModal />*/}
            <Link href="/proforma/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="w-full mb-6">
        <div className="flex bg-muted/50 p-1 w-max rounded-xl">
          <button
            type="button"
            className={cn("rounded-lg px-6 py-2 text-sm font-medium transition-all", activeTab === 'quotes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted')}
            onClick={() => { setActiveTab('quotes'); setCurrentPage(1); }}
          >
            Quotes
          </button>
          <button
            type="button"
            className={cn("rounded-lg px-6 py-2 text-sm font-medium transition-all", activeTab === 'templates' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted')}
            onClick={() => { setActiveTab('templates'); setCurrentPage(1); }}
          >
            Templates
          </button>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden bg-transparent hidden md:block">
        <div className="hidden md:block">
          {filteredProformas.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th scope="col" className="px-6 py-4">{activeTab === 'templates' ? 'Template Name' : 'Project'}</th>
                  {activeTab === 'quotes' && (
                    <>
                      <th scope="col" className="px-6 py-4">Client</th>
                      <th scope="col" className="px-6 py-4">Date</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                    </>
                  )}
                  <th scope="col" className="px-6 py-4 text-right">Total</th>
                  <th scope="col" className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedProformas.map((proforma) => (
                  <tr
                    key={proforma.id}
                    className="group hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/proforma/${proforma.id}?view=quote`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{proforma.project_name} - #{proforma.number}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">REF: {proforma.number || proforma.id.split('-')[0]}</p>
                    </td>
                    {activeTab === 'quotes' && (
                      <>
                        <td className="px-6 py-4">{(proforma.clients as any)?.company_name || (proforma.clients as any)?.name || 'No Client'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(proforma.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${proforma.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            proforma.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              proforma.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                proforma.status === 'job_terminated' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                  proforma.status === 'job' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-muted/50 text-muted-foreground border-border/40'
                            }`}>
                            {proforma.status === 'job_terminated' ? 'Terminado' : (proforma.status || 'draft')}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-right font-bold tabular-nums text-primary">
                      ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeTab === 'templates' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold border-primary/20 hover:bg-primary/5 px-3 rounded-lg flex items-center gap-1 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/proforma/${proforma.id}/edit`);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold border-destructive/20 text-destructive hover:bg-destructive/5 px-3 rounded-lg flex items-center gap-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this template?')) {
                                const { createClient } = await import('@/lib/supabase/client');
                                const supabase = createClient();
                                await supabase.from('proformas').delete().eq('id', proforma.id);
                                window.location.reload();
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold border-primary/20 hover:bg-primary/5 px-4 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/proforma/${proforma.id}?view=quote`);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </Card>
      {/* Mobile View */}
      <div className="md:hidden">
        {paginatedProformas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 p-0">
            {paginatedProformas.map((proforma) => (
              <Card
                key={proforma.id}
                className="overflow-hidden border-border/40 shadow-sm transition-all active:scale-[0.98]"
                onClick={() => router.push(`/proforma/${proforma.id}?view=quote`)}
              >
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{proforma.project_name} - #{proforma.number}</h3>
                      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase mt-1">REF: {proforma.number || proforma.id.split('-')[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary text-lg">${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {activeTab === 'quotes' && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Client</p>
                        <p className="text-xs font-bold truncate max-w-[120px]">
                          {(proforma.clients as any)?.company_name || (proforma.clients as any)?.name || 'No Client'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Status</p>
                        <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${proforma.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          proforma.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-muted/50 text-muted-foreground border-border/40'
                          }`}>
                          {proforma.status || 'draft'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      {new Date(proforma.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {activeTab === 'templates' && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/proforma/${proforma.id}/edit`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure?')) {
                              const { createClient } = await import('@/lib/supabase/client');
                              const supabase = createClient();
                              await supabase.from('proformas').delete().eq('id', proforma.id);
                              window.location.reload();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Empty State shared */}
      {filteredProformas.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
          {activeTab === 'templates' ? (
            <LayoutTemplate className="h-16 w-16 text-muted/20 mb-4" />
          ) : (
            <FileText className="h-16 w-16 text-muted/20 mb-4" />
          )}
          <p className="text-lg  italic">
            {activeTab === 'templates' ? 'No templates found.' : 'No quotes found.'}
          </p>
        </div>
      ) : null}


      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between bg-muted/20">
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{Math.min(filteredProformas.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProformas.length, currentPage * itemsPerPage)}</span> of <span className="text-foreground">{filteredProformas.length}</span> quotes
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
              {(() => {
                const pages = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  if (currentPage <= 4) {
                    pages.push(1, 2, 3, 4, 5, '...', totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                  }
                }

                return pages.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground/50 font-bold select-none cursor-default">
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={`page-${page}`}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 rounded-lg p-0 text-xs font-bold ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </Button>
                  );
                });
              })()}
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

    </div>
  );
}
