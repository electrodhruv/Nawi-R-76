'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthScreen } from '@/components/auth/AuthScreen';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (user: { fullName: string; role: string; email: string }) => {
    try {
      localStorage.setItem('nawi_r76_active_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
    router.push('/');
  };

  return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
}
