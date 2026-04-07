import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { notFound, redirect } from 'next/navigation';
import { signupTeamMember } from './actions';

export default async function TeamRegisterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // Validate token
  const { data: invitation, error } = await supabase
    .from('team_invitations')
    .select('*, team_members(*)')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  console.log(invitation);

  if (error || !invitation) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50 text-center py-10">
          <CardTitle className="text-xl text-destructive mb-2">Invalid or Expired Invitation</CardTitle>
          <CardDescription>
            This invitation link is not valid. Please ask your administrator to send you a new one.
          </CardDescription>
        </Card>
      </div>
    );
  }

  // Pre-bind action with token and member id
  const submitAction = signupTeamMember.bind(null, token, invitation.team_member_id);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
        <form action={submitAction}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl  text-center">Team Registration</CardTitle>
            <CardDescription className="text-center">
              Create your account to accept your invitation to {invitation.team_members.name}&apos;s profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={invitation.email} readOnly className="bg-muted" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="Enter a secure password" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-bold">
              Complete Registration
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
