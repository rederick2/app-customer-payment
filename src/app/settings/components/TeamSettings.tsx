'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Pencil, X, Save, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createTeamInvitation } from './teamActions';

export default function TeamSettings({ initialTeamMembers }: { initialTeamMembers: any[] }) {
  const [members, setMembers] = useState(initialTeamMembers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [currentInviteLink, setCurrentInviteLink] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('team_members').insert([{
      user_id: user?.id,
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      hourly_cost: parseFloat(formData.get('hourly_cost') as string) || 0,
    }]);

    if (!error) {
      toast.success('Team member added successfully');
      fetchMembers();
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error('Failed to add team member');
    }
    setIsSubmitting(false);
  };

  const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from('team_members').update({
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      hourly_cost: parseFloat(formData.get('hourly_cost') as string) || 0,
    }).eq('id', id);

    if (!error) {
      toast.success('Team member upated successfully');
      setEditingId(null);
      fetchMembers();
    } else {
      toast.error('Failed to update team member');
    }
    setIsSubmitting(false);
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (!error) {
      toast.success('Team member removed');
      fetchMembers();
    } else {
      toast.error('Failed to remove team member');
    }
  };

  const fetchMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (data) setMembers(data);
  };

  const handleGenerateInvite = async (memberId: string, email: string) => {
    setIsGeneratingInvite(true);
    const res = await createTeamInvitation(memberId, email || 'team@example.com');
    setIsGeneratingInvite(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      const inviteLink = `${window.location.origin}/register/team/${res.token}`;
      setCurrentInviteLink(inviteLink);
      setInviteModalOpen(true);
    }
  };

  return (
    <Card className="border-border/50 rounded-xl">
      <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
        <CardTitle className="text-xl text-[#0D3B47]">Team Members</CardTitle>
        <CardDescription className="text-muted-foreground/80 pt-1">
          Manage your employees and contractors. Defining their standard hourly costs here automatically speeds up job time entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-8">
        {/* ADD NEW MEMBER */}
        <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-muted/20 p-6 rounded-xl border border-border/40 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Name</Label>
            <Input id="name" name="name" placeholder="John Doe" className="bg-background font-medium h-10 transition-colors focus:border-primary/50" required />
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Role</Label>
            <Input id="role" name="role" placeholder="e.g. Electrician" className="bg-background h-10" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" className="bg-background h-10" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="hourly_cost" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Hourly Cost ($)</Label>
            <Input id="hourly_cost" name="hourly_cost" type="number" step="0.01" min="0" placeholder="25.00" className="bg-background h-10 font-mono" required />
          </div>
          <div className="flex items-end justify-center md:justify-end md:col-span-1 pt-4 md:pt-0">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Add Team Member</>}
            </Button>
          </div>
        </form>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted/5 italic border border-dashed border-border/50 rounded-xl">
              No team members found. Add one above to get started.
            </div>
          ) : members.map((member) => (
            <div key={member.id} className="bg-muted/10 border border-border/50 rounded-xl overflow-hidden transition-all">
              {editingId === member.id ? (
                <form onSubmit={(e) => handleUpdateMember(e, member.id)} className="p-4 space-y-4 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Name</Label>
                    <Input name="name" defaultValue={member.name} className="h-10" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Role</Label>
                      <Input name="role" defaultValue={member.role} className="h-10" placeholder="Role" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Hourly Cost ($)</Label>
                      <Input name="hourly_cost" type="number" step="0.01" min="0" defaultValue={member.hourly_cost} className="h-10 font-mono" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email</Label>
                    <Input name="email" type="email" defaultValue={member.email} className="h-10" placeholder="Email" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)} className="h-10 px-4">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-archivo font-bold text-lg text-[#0D3B47] uppercase tracking-tight">{member.name}</h4>
                      <p className="text-sm text-muted-foreground font-medium">{member.role || 'No role defined'}</p>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      {member.auth_user_id ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase bg-emerald-500/10 px-2 py-1 rounded-md">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase bg-muted/50 px-2 py-1 rounded-md">
                          Pending
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/40">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Email</p>
                      <p className="text-xs font-medium truncate">{member.email || '-'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Hourly Cost</p>
                      <p className="text-sm font-mono font-bold text-[#0D3B47]">${Number(member.hourly_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-1">
                    <div className="flex gap-2">
                      {!member.auth_user_id && (
                        <Button variant="outline" size="sm" onClick={() => handleGenerateInvite(member.id, member.email)} className="h-9 px-3 text-blue-600 hover:bg-blue-50">
                          <LinkIcon className="h-3.5 w-3.5 mr-2" /> Invite
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(member.id)} className="h-9 w-9 p-0 text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteMember(member.id)} className="h-9 w-9 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block rounded-xl border border-border/50 overflow-x-auto bg-background">
          <table className="w-full text-sm text-left align-middle border-collapse">
            <thead className="text-xs uppercase bg-muted/30 text-muted-foreground font-semibold border-b border-border/50">
              <tr>
                <th className="px-5 py-4 min-w-[150px]">Name</th>
                <th className="px-5 py-4 min-w-[120px]">Role</th>
                <th className="px-5 py-4 min-w-[180px]">Email</th>
                <th className="px-5 py-4 min-w-[100px]">Status</th>
                <th className="px-5 py-4 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground bg-muted/5 italic">
                    No team members found. Add one above to get started.
                  </td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/10 transition-colors group">
                  {editingId === member.id ? (
                    <td colSpan={6} className="p-0">
                      <form onSubmit={(e) => handleUpdateMember(e, member.id)} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
                        <div>
                          <Input name="name" defaultValue={member.name} className="h-9 font-medium" required />
                        </div>
                        <div>
                          <Input name="role" defaultValue={member.role} className="h-9" placeholder="Role" />
                        </div>
                        <div>
                          <Input name="email" type="email" defaultValue={member.email} className="h-9" placeholder="Email" />
                        </div>
                        <div>
                          <Input name="hourly_cost" type="number" step="0.01" min="0" defaultValue={member.hourly_cost} className="h-9 font-mono text-center" required />
                        </div>
                        <div className="flex justify-end gap-2 items-center">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)} className="h-9 w-9 p-0" title="Cancel">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button type="submit" size="sm" className="h-9 w-9 p-0 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting} title="Save">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-5 py-4 font-bold text-[#0D3B47] uppercase tracking-tighter">{member.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{member.role || '-'}</td>
                      <td className="px-5 py-4 text-muted-foreground/80 text-xs truncate max-w-[200px]">{member.email || '-'}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-mono bg-muted/30 px-2 py-1 rounded text-[#0D3B47] font-semibold">${Number(member.hourly_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-5 py-4">
                        {member.auth_user_id ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold uppercase">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-bold uppercase">
                            Pending Invite
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {!member.auth_user_id && (
                            <Button variant="outline" size="sm" onClick={() => handleGenerateInvite(member.id, member.email)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Generate Invite Link">
                              <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setEditingId(member.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteMember(member.id)} className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>TEAM INVITATION</DialogTitle>
            <DialogDescription>
              Share this link with your team member to grant access to the Team Portal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-3 pt-6">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                defaultValue={currentInviteLink}
                readOnly
                className="font-mono text-[10px] h-12 bg-muted/20 border-border/40 rounded-xl"
              />
            </div>
            <Button type="button" className="px-6 h-12" onClick={() => {
              navigator.clipboard.writeText(currentInviteLink);
              toast.success('Link copied to clipboard');
            }}>
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
