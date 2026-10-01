'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { IssuesFindingsView } from '@/components/operations/IssuesFindingsView';

export default function IssuesPage() {
  const router = useRouter();

  return (
    <LaboratoryShell activeNav="issues">
      <IssuesFindingsView
        onOpenEvaluation={(evalNum) => {
          router.push(`/workflow?eval=${evalNum}&step=4`);
        }}
        onOpenTestRun={(code) => {
          router.push(`/workflow?test=${code}&step=4`);
        }}
      />
    </LaboratoryShell>
  );
}
