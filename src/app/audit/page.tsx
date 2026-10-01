'use client';

import React from 'react';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { AuditTrailView } from '@/components/operations/AuditTrailView';

export default function AuditPage() {
  return (
    <LaboratoryShell activeNav="audit">
      <AuditTrailView />
    </LaboratoryShell>
  );
}
