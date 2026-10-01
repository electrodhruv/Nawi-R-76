'use client';

import React, { useState } from 'react';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { OimlRevisionsView } from '@/components/operations/OimlRevisionsView';

export default function OimlRevisionsPage() {
  const [activeEdition, setActiveEdition] = useState('oiml-r76-2006');

  return (
    <LaboratoryShell activeNav="oiml-revisions">
      <OimlRevisionsView
        activeEditionId={activeEdition}
        onSelectEdition={(id) => setActiveEdition(id)}
      />
    </LaboratoryShell>
  );
}
