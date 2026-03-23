'use client';

import { useSearchParams } from 'next/navigation';
import ProformaForm from '../components/ProformaForm';
import { Suspense } from 'react';

function NewProformaContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  return (
    <ProformaForm 
      mode="create" 
      initialData={clientId ? { client: { id: clientId } } as any : undefined} 
    />
  );
}

export default function NewProforma() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Cargando...</div>}>
      <NewProformaContent />
    </Suspense>
  );
}
