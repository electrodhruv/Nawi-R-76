'use client';

import React from 'react';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { ReferenceStandardsView } from '@/components/operations/ReferenceStandardsView';

export default function StandardsPage() {
  return (
    <LaboratoryShell activeNav="standards">
      <ReferenceStandardsView />
    </LaboratoryShell>
  );
}
