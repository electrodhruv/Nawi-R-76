'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { HomeScreen, RecentEvaluation } from '@/components/home/HomeScreen';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { PRESET_USER_PROFILES } from '@/lib/rbac';

export default function HomePage() {
  const router = useRouter();

  const handleStartNew = () => {
    router.push('/select-instrument');
  };

  const handleContinue = (evaluation: RecentEvaluation) => {
    router.push(
      `/workflow?eval=${encodeURIComponent(evaluation.evaluationNumber)}&step=${evaluation.targetStep || 4}&serial=${encodeURIComponent(evaluation.serialNumber)}&prefill=1`
    );
  };

  const handleSelectSpecimenDirect = (
    instrument: RegisteredInstrument,
    targetStep?: 1 | 4 | 5 | 6,
    prefillDemo?: boolean
  ) => {
    router.push(
      `/workflow?serial=${encodeURIComponent(instrument.serialNumber)}&step=${targetStep || 1}${prefillDemo ? '&prefill=1' : ''}`
    );
  };

  const handleNavigateView = (view: string) => {
    if (view === 'home') {
      router.push('/');
    } else {
      router.push(`/${view}`);
    }
  };

  return (
    <LaboratoryShell activeNav="home">
      <HomeScreen
        onStartNewEvaluation={handleStartNew}
        onContinueEvaluation={handleContinue}
        onSelectSpecimenDirect={handleSelectSpecimenDirect}
        currentUser={PRESET_USER_PROFILES.LEAD_METROLOGIST}
        onNavigateView={handleNavigateView}
      />
    </LaboratoryShell>
  );
}
