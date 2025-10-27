'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useIsClient } from '@/hooks/useIsClient';
import DashboardLoadingScreen from '@/components/DashboardLoadingScreen';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { 
    isAuthenticated, 
    isLoading, 
    hasPassword, 
    isHydrated 
  } = useAuth();

  // Redirect based on auth state
  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!hasPassword) {
      router.replace('/setup');
    } else if (!isAuthenticated) {
      router.replace('/login');
    } else if (!activeConnection) {
      router.replace('/connections');
    }
  }, [isAuthenticated, hasPassword, activeConnection, isHydrated, isLoading, router]);

  // Show loading while checking auth state
  if (!isClient || !isHydrated || isLoading || !isAuthenticated || !activeConnection) {
    return <DashboardLoadingScreen />;
  }

  return <Dashboard />;
}
