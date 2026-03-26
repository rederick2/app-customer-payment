'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateProfile } from '../actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal details that will appear on your proformas.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name / Studio Name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={initialData?.display_name || ''}
              placeholder="e.g. Acme Design Studio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialData?.phone || ''}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData?.address || ''}
              placeholder="123 Design St, City, Country"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proformaSequenceStart">Next Proforma Number (Starting Sequence)</Label>
            <Input
              id="proformaSequenceStart"
              name="proformaSequenceStart"
              type="number"
              min="1"
              defaultValue={initialData?.proforma_sequence_start || 1}
              placeholder="e.g. 100"
            />
            <p className="text-xs text-muted-foreground">
              Your next proforma will use this number if it's higher than your current highest number.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
