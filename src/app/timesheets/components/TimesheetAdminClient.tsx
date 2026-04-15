'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchQBOEmployeesAndVendors, linkQBOTeamMember, syncTimeEntryToQB } from '../actions';

export default function TimesheetAdminClient({ initialEntries, hasQuickbooks }: { initialEntries: any[], hasQuickbooks: boolean }) {
  const [entries, setEntries] = useState(initialEntries);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mappingEntry, setMappingEntry] = useState<any>(null);
  const [qboData, setQboData] = useState<{employees: any[], vendors: any[]}>({ employees: [], vendors: [] });
  const [isLoadingQBO, setIsLoadingQBO] = useState(false);
  
  const [selectedQBOId, setSelectedQBOId] = useState<string>('');
  const [selectedQBOType, setSelectedQBOType] = useState<'Employee'|'Vendor'>('Employee');

  const handleSyncButton = async (entry: any) => {
    if (!hasQuickbooks) {
      toast.error('Connect QuickBooks in Settings first.');
      return;
    }

    if (entry.status === 'active') {
      toast.error('Cannot sync an active timer.');
      return;
    }

    // Check if team member is already mapped
    if (entry.team_members.qbo_employee_id) {
      performSync(entry.id);
    } else {
      // Need to map them first
      setMappingEntry(entry);
      setMapModalOpen(true);
      fetchMappingData();
    }
  };

  const fetchMappingData = async () => {
    setIsLoadingQBO(true);
    const res = await fetchQBOEmployeesAndVendors();
    setIsLoadingQBO(false);
    if (res.error) {
      toast.error(res.error);
      setMapModalOpen(false);
    } else if (res.data) {
      setQboData(res.data);
    }
  };

  const handleSaveMappingAndSync = async () => {
    if (!selectedQBOId) {
      toast.error('Please select an employee or vendor');
      return;
    }
    
    setIsSyncing(mappingEntry.id);
    setMapModalOpen(false);

    // 1. Save mapping
    const mapRes = await linkQBOTeamMember(mappingEntry.team_member_id, selectedQBOId, selectedQBOType);
    if (mapRes.error) {
      toast.error(mapRes.error);
      setIsSyncing(null);
      return;
    }

    // 2. Perform Sync
    performSync(mappingEntry.id);
  };

  const performSync = async (entryId: string) => {
    setIsSyncing(entryId);
    const res = await syncTimeEntryToQB(entryId);
    setIsSyncing(null);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Synced to QuickBooks!');
      // Update local state to reflect synced status
      setEntries(entries.map(e => e.id === entryId ? { ...e, status: 'synced' } : e));
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      {entries.map(entry => (
        <Card key={entry.id} className="border-border/50 shadow-sm overflow-hidden group">
          <CardContent className="p-0 flex flex-col sm:flex-row">
            {/* Info Section */}
            <div className="p-5 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg text-[#0D3B47]">{entry.team_members.name}</span>
                <Badge variant="outline" className={`text-[10px] tracking-widest uppercase font-bold 
                  ${entry.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    entry.status === 'synced' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  {entry.status}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-semibold">{entry.proformas ? `${entry.proformas.project_name} - #${entry.proformas.number}` : 'General Task'}</span>
                <span>•</span>
                <span>{new Date(entry.start_time).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Time Section */}
            <div className="bg-muted/10 p-5 w-full sm:w-48 flex flex-col justify-center items-center border-t sm:border-t-0 sm:border-l border-border/50">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Duration
              </div>
              <div className="text-2xl font-mono text-[#0D3B47] font-semibold">
                {entry.status === 'active' ? 'Activo...' : formatDuration(entry.duration_seconds)}
              </div>
            </div>

            {/* Action Section */}
            <div className="p-5 w-full sm:w-48 flex items-center justify-center bg-muted/5 border-t sm:border-t-0 sm:border-l border-border/50">
              {entry.status === 'synced' ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  Synced via QBO
                </div>
              ) : entry.status === 'active' ? (
                <div className="text-xs text-muted-foreground text-center italic">
                  Timer running...
                </div>
              ) : (
                <Button 
                  onClick={() => handleSyncButton(entry)}
                  disabled={isSyncing === entry.id || !hasQuickbooks}
                  className="w-full font-bold shadow-sm transition-all bg-[#0D3B47] hover:bg-[#082229]"
                >
                  {isSyncing === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Entry
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {entries.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border/50">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No time entries found yet.</p>
        </div>
      )}

      {/* Mapping Modal */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MAP TEAM MEMBER</DialogTitle>
            <DialogDescription>
              Link "{mappingEntry?.team_members?.name}" to a QuickBooks record for synchronization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingQBO ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Type *</label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant={selectedQBOType === 'Employee' ? 'default' : 'secondary'} 
                        onClick={() => { setSelectedQBOType('Employee'); setSelectedQBOId(''); }}
                        className="flex-1"
                      >
                        Employee
                      </Button>
                      <Button 
                        type="button" 
                        variant={selectedQBOType === 'Vendor' ? 'default' : 'secondary'} 
                        onClick={() => { setSelectedQBOType('Vendor'); setSelectedQBOId(''); }}
                        className="flex-1"
                      >
                        Vendor
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">QuickBooks Match *</label>
                  <Select onValueChange={(val) => setSelectedQBOId(val || '')} value={selectedQBOId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select one..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedQBOType === 'Employee' ? qboData.employees : qboData.vendors).map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setMapModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMappingAndSync} disabled={!selectedQBOId || isLoadingQBO} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl">
              Confirm & Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
