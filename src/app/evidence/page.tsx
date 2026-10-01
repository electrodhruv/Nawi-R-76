'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { EvidenceRegisterView } from '@/components/operations/EvidenceRegisterView';

export default function EvidencePage() {
  const router = useRouter();

  return (
    <LaboratoryShell activeNav="evidence">
      <EvidenceRegisterView
        onOpenEvaluation={(evalNum) => {
          router.push(`/workflow?eval=${evalNum}&step=4`);
        }}
      />
    </LaboratoryShell>
  );
}
