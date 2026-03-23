'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuotesListProps {
  initialProformas: any[];
}

export function QuotesList({ initialProformas }: QuotesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

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
    <div className="space-y-4">
      <div className="flex items-center gap-4 max-w-md w-full ml-auto">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por proyecto o cliente..." 
            className="pl-10 h-10 border-border/40 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20 transition-all rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          {filteredProformas.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th scope="col" className="px-6 py-4">Proyecto</th>
                  <th scope="col" className="px-6 py-4">Cliente</th>
                  <th scope="col" className="px-6 py-4">Fecha</th>
                  <th scope="col" className="px-6 py-4">Estado</th>
                  <th scope="col" className="px-6 py-4 text-right">Total</th>
                  <th scope="col" className="px-6 py-4 text-right">Acción</th>
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
                      <p className="font-bold text-foreground">{proforma.project_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">REF: {proforma.id.split('-')[0]}</p>
                    </td>
                    <td className="px-6 py-4">{(proforma.clients as any)?.name || 'Sin Cliente'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(proforma.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        proforma.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        proforma.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        proforma.status === 'job' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-muted/50 text-muted-foreground border-border/40'
                      }`}>
                        {proforma.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold tabular-nums text-primary">
                      ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs font-bold border-primary/20 hover:bg-primary/5 px-4 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/proforma/${proforma.id}?view=quote`);
                        }}
                      >
                        Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-16 w-16 text-muted/20 mb-4" />
              <p className="text-lg font-serif italic">No se encontraron proformas.</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  className="mt-2 text-primary" 
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between bg-muted/20">
            <div className="text-xs text-muted-foreground font-medium">
              Mostrando <span className="text-foreground">{Math.min(filteredProformas.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProformas.length, currentPage * itemsPerPage)}</span> de <span className="text-foreground">{filteredProformas.length}</span> proformas
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
      </Card>
    </div>
  );
}
