'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { EvaluationRegisterView } from '@/components/operations/EvaluationRegisterView';
import { EvaluationRecord } from '@/services/operations/evaluation-register-service';
import { PRESET_USER_PROFILES } from '@/lib/rbac';

export default function EvaluationsPage() {
  const router = useRouter();

  return (
    <LaboratoryShell activeNav="evaluations">
      <EvaluationRegisterView
        currentUser={PRESET_USER_PROFILES.LEAD_METROLOGIST}
        onOpenEvaluation={(rec: EvaluationRecord, step) => {
          router.push(`/workflow?eval=${rec.evaluationNumber}&step=${step || 4}`);
        }}
        onStartNewEvaluation={() => router.push('/select-instrument')}
      />
    </LaboratoryShell>
  );
}
