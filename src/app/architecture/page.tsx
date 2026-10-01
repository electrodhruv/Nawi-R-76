'use client';

import React from 'react';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { ArchitectureDocsView } from '@/components/operations/ArchitectureDocsView';

export default function ArchitecturePage() {
  return (
    <LaboratoryShell activeNav="architecture">
      <ArchitectureDocsView />
    </LaboratoryShell>
  );
}
