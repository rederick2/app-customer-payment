'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Autocomplete from 'react-google-autocomplete';

export default function NewClientPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
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
        .insert([{
          company_name: companyName,
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
          country
        }]);

      if (error) throw error;

      router.push('/clients');
      router.refresh();

    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
      <div className="mb-6">
        <Link href="/clients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Clientes
        </Link>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Contact Details */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-serif">Detalles de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Razón Social o Compañía (Opcional)</Label>
              <Input id="companyName" placeholder="Ej. Empresa SA" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" placeholder="Sr., Sra., Ing." value={title} onChange={e => setTitle(e.target.value)} />
                </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input id="firstName" required placeholder="Ej. Juan" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input id="lastName" required placeholder="Ej. Pérez" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" placeholder="+123456789" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Address */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-serif">Dirección (Property Address)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street1">Línea de Calle 1 (Busca con Google) *</Label>
              <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                onPlaceSelected={handlePlaceSelected}
                options={{
                  types: ["address"],
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Empieza a escribir una dirección..."
                defaultValue={street1}
                onChange={(e: any) => setStreet1(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street2">Línea de Calle 2</Label>
              <Input id="street2" placeholder="Departamento, Suite, Piso..." value={street2} onChange={e => setStreet2(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" placeholder="Ej. Madrid" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia / Estado</Label>
                <Input id="province" placeholder="Ej. Madrid" value={province} onChange={e => setProvince(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input id="postalCode" placeholder="28001" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" placeholder="España" value={country} onChange={e => setCountry(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-12">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:-translate-y-1">
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
