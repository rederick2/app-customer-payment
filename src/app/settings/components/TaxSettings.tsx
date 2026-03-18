'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addTax, deleteTax } from '../actions';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function TaxSettings({ initialTaxes }: { initialTaxes: any[] }) {
  const [taxes, setTaxes] = useState(initialTaxes);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPercentage, setNewPercentage] = useState('');

  async function handleAddTax(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newPercentage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('name', newName);
    formData.append('percentage', newPercentage);

    try {
      await addTax(formData);
      // Optimistic update or just refresh since it's a small app
      // For now, let's just show a toast. The server component will refresh on revalidatePath.
      // But since we want immediate feedback, we'd need to fetch or use refresh().
      // For simplicity in this demo, let's just reload the page to get the new data.
      window.location.reload();
      toast.success('Tax added successfully');
      setNewName('');
      setNewPercentage('');
    } catch (error) {
      toast.error('Failed to add tax');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTax(id: string) {
    if (!confirm('Are you sure you want to delete this tax?')) return;

    try {
      await deleteTax(id);
      setTaxes(taxes.filter(t => t.id !== id));
      toast.success('Tax deleted');
    } catch (error) {
      toast.error('Failed to delete tax');
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Tax</CardTitle>
          <CardDescription>
            These taxes will be available to include in your proformas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTax} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label htmlFor="name">Tax Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. VAT, Sales Tax"
                required
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <Label htmlFor="percentage">Percentage (%)</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Tax
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Taxes</CardTitle>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No taxes configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell className="font-medium">{tax.name}</TableCell>
                    <TableCell>{tax.percentage}%</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTax(tax.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
