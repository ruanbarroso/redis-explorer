'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useIsClient } from '@/hooks/useIsClient';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const router = useRouter();
  const isClient = useIsClient();
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { 
    isAuthenticated, 
    isLoading, 
    hasPassword, 
    isHydrated 
  } = useAuth();

  // Handle redirects based on auth state
  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!hasPassword) {
      router.replace('/setup');
    } else if (!isAuthenticated) {
      router.replace('/login');
    } else if (!activeConnection) {
      router.replace('/connections');
    } else {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, hasPassword, activeConnection, isHydrated, isLoading, router]);

  // Show loading screen while checking auth state
  if (!isClient || !isHydrated || isLoading) {
    return <LoadingScreen />;
  }

  // This will be replaced by the redirect, but we need to return something
  return <LoadingScreen />;
}
