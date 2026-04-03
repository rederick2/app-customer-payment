'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Autocomplete from 'react-google-autocomplete';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  const [workPhone, setWorkPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [faxPhone, setFaxPhone] = useState('');
  const [otherPhones, setOtherPhones] = useState('');

  const [billingStreet1, setBillingStreet1] = useState('');
  const [billingStreet2, setBillingStreet2] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('');

  const [tags, setTags] = useState('');
  const [leadSource, setLeadSource] = useState('');

  const [reminders, setReminders] = useState(true);
  const [jobFollowUps, setJobFollowUps] = useState(true);
  const [quoteFollowUps, setQuoteFollowUps] = useState(true);
  const [invoiceFollowUps, setInvoiceFollowUps] = useState(true);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function loadClient() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) {
        setTitle(data.title || '');
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setStreet1(data.street_1 || '');
        setStreet2(data.street_2 || '');
        setCity(data.city || '');
        setProvince(data.province || '');
        setPostalCode(data.postal_code || '');
        setCountry(data.country || '');

        setWorkPhone(data.work_phone || '');
        setMobilePhone(data.mobile_phone || '');
        setHomePhone(data.home_phone || '');
        setFaxPhone(data.fax_phone || '');
        setOtherPhones(data.other_phones || '');

        setBillingStreet1(data.billing_street_1 || '');
        setBillingStreet2(data.billing_street_2 || '');
        setBillingCity(data.billing_city || '');
        setBillingState(data.billing_state || '');
        setBillingPostalCode(data.billing_zip_code || '');
        setBillingCountry(data.billing_country || '');

        setTags(data.tags || '');
        setLeadSource(data.lead_source || '');

        setReminders(data.receives_automatic_visit_reminders ?? true);
        setJobFollowUps(data.receives_automatic_job_follow_ups ?? true);
        setQuoteFollowUps(data.receives_automatic_quote_follow_ups ?? true);
        setInvoiceFollowUps(data.receives_automatic_invoice_follow_ups ?? true);
      }
      setIsLoading(false);
    }
    loadClient();
  }, [params.id, supabase]);

  const handlePlaceSelected = (place: any) => {
    let streetNumber = '';
    let route = '';
    let locality = '';
    let administrativeArea = '';
    let countryName = '';
    let code = '';

    place.address_components?.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) streetNumber = component.long_name;
      if (types.includes('route')) route = component.long_name;
      if (types.includes('locality')) locality = component.long_name;
      if (types.includes('administrative_area_level_1')) administrativeArea = component.long_name;
      if (types.includes('country')) countryName = component.long_name;
      if (types.includes('postal_code')) code = component.long_name;
    });

    setStreet1(`${route} ${streetNumber}`.trim());
    setCity(locality);
    setProvince(administrativeArea);
    setCountry(countryName);
    setPostalCode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          title,
          first_name: firstName,
          last_name: lastName,
          phone,
          email,
          street_1: street1,
          street_2: street2,
          city,
          province,
          postal_code: postalCode,
          country,
          work_phone: workPhone,
          mobile_phone: mobilePhone,
          home_phone: homePhone,
          fax_phone: faxPhone,
          other_phones: otherPhones,
          billing_street_1: billingStreet1,
          billing_street_2: billingStreet2,
          billing_city: billingCity,
          billing_state: billingState,
          billing_zip_code: billingPostalCode,
          billing_country: billingCountry,
          tags,
          lead_source: leadSource,
          receives_automatic_visit_reminders: reminders,
          receives_automatic_job_follow_ups: jobFollowUps,
          receives_automatic_quote_follow_ups: quoteFollowUps,
          receives_automatic_invoice_follow_ups: invoiceFollowUps
        })
        .eq('id', params.id);

      if (error) throw error;

      router.push('/clients');
      router.refresh();

    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error to update client. Please try again.');
      setIsSubmitting(false);
    }
  };

  const copyServiceAddress = () => {
    setBillingStreet1(street1);
    setBillingStreet2(street2);
    setBillingCity(city);
    setBillingState(province);
    setBillingPostalCode(postalCode);
    setBillingCountry(country);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id);

    if (error) {
      alert('Error to delete client');
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    } else {
      router.push('/clients');
      router.refresh();
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading client...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href={`../${params.id}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Edit Client</h1>
        </div>
        <Button variant="destructive" size="sm" type="button" onClick={() => setShowDeleteDialog(true)} disabled={isSubmitting}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this client? All associated proformas, invoices, and records will also be deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Yes, delete client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Contact Details */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-serif">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Sr., Sra., Ing." value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" required placeholder="Ej. Juan" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" required placeholder="Ej. Pérez" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+123456789" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="VIP, lead, etc." value={tags} onChange={e => setTags(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Input id="leadSource" placeholder="Referencia, Google, etc." value={leadSource} onChange={e => setLeadSource(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extra Phones */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-serif">Additional Phones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workPhone">Work</Label>
                <Input id="workPhone" type="tel" value={workPhone} onChange={e => setWorkPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Mobile</Label>
                <Input id="mobilePhone" type="tel" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homePhone">Home</Label>
                <Input id="homePhone" type="tel" value={homePhone} onChange={e => setHomePhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faxPhone">Fax</Label>
                <Input id="faxPhone" type="tel" value={faxPhone} onChange={e => setFaxPhone(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="otherPhones">Other Phones</Label>
                <Input id="otherPhones" type="text" value={otherPhones} onChange={e => setOtherPhones(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Address */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-serif">Address (Property Address)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street1">Street Line 1</Label>
              <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                onPlaceSelected={handlePlaceSelected}
                options={{
                  types: ["address"],
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Start typing an address..."
                defaultValue={street1}
                onChange={(e: any) => setStreet1(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street2">Street Line 2</Label>
              <Input id="street2" placeholder="Apartment, Suite, Floor..." value={street2} onChange={e => setStreet2(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Ex. New York" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">State</Label>
                <Input id="province" placeholder="Ex. New York" value={province} onChange={e => setProvince(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" placeholder="28001" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="España" value={country} onChange={e => setCountry(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-serif">Billing Address</CardTitle>
              <CardDescription>Optional. If it is the same as the service address, it can be left empty.</CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={copyServiceAddress}
              className="text-[11px] h-8 font-medium"
            >
              Copy Address
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billingStreet1">Street Line 1</Label>
              <Input id="billingStreet1" value={billingStreet1} onChange={e => setBillingStreet1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingStreet2">Street Line 2</Label>
              <Input id="billingStreet2" placeholder="Apartment, Suite, Floor..." value={billingStreet2} onChange={e => setBillingStreet2(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCity">City</Label>
                <Input id="billingCity" value={billingCity} onChange={e => setBillingCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingState">State</Label>
                <Input id="billingState" value={billingState} onChange={e => setBillingState(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingPostalCode">Postal Code</Label>
                <Input id="billingPostalCode" value={billingPostalCode} onChange={e => setBillingPostalCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingCountry">Country</Label>
                <Input id="billingCountry" value={billingCountry} onChange={e => setBillingCountry(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-serif">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="reminders" checked={reminders} onCheckedChange={(c) => setReminders(!!c)} />
              <Label htmlFor="reminders" className="cursor-pointer">Receive automatic visit reminders</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="jobFollowUps" checked={jobFollowUps} onCheckedChange={(c) => setJobFollowUps(!!c)} />
              <Label htmlFor="jobFollowUps" className="cursor-pointer">Receive automatic job follow-ups</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="quoteFollowUps" checked={quoteFollowUps} onCheckedChange={(c) => setQuoteFollowUps(!!c)} />
              <Label htmlFor="quoteFollowUps" className="cursor-pointer">Receive automatic quote follow-ups</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="invoiceFollowUps" checked={invoiceFollowUps} onCheckedChange={(c) => setInvoiceFollowUps(!!c)} />
              <Label htmlFor="invoiceFollowUps" className="cursor-pointer">Receive automatic invoice follow-ups</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-12">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:-translate-y-1">
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Saving...' : 'Update Client'}
          </Button>
        </div>
      </form>
    </div>
  );
}
