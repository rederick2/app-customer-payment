'use client';

import ProformaForm from '@/app/proforma/components/ProformaForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  return (
    <ProformaForm
      mode="create"
      initialData={{
        proforma: { status: 'job', job_type: 'one-off' },
        items: [],
        client: undefined,
      }}
      onBack={() => window.history.back()}
    />
  );
}
