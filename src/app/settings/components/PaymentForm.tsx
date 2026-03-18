'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updatePaymentInfo } from '../actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function PaymentForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await updatePaymentInfo(formData);
      toast.success('Payment information updated');
    } catch (error) {
      toast.error('Failed to update payment information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          This information will be shown to clients to facilitate payments.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              name="bankName"
              defaultValue={initialData?.bank_name || ''}
              placeholder="e.g. Chase Bank, Santander"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Bank Account Number / IBAN</Label>
            <Input
              id="bankAccount"
              name="bankAccount"
              defaultValue={initialData?.bank_account || ''}
              placeholder="XXXX XXXX XXXX XXXX"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Payment Details
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
