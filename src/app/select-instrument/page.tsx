'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { InstrumentSelector } from '@/components/workflow/InstrumentSelector';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';

export default function SelectInstrumentPage() {
  const router = useRouter();

  const handleSelectInstrument = (instrument: RegisteredInstrument, targetStep = 1) => {
    router.push(`/workflow?serial=${instrument.serialNumber}&step=${targetStep}`);
  };

  return (
    <LaboratoryShell activeNav="select-instrument">
      <InstrumentSelector
        onSelectInstrument={handleSelectInstrument}
        onCancel={() => router.push('/')}
      />
    </LaboratoryShell>
  );
}
