'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { disconnectFromRedis } from '@/store/slices/connectionSlice';
import ConnectionSelector from '@/components/ConnectionSelector';
import { useAuth } from '@/hooks/useAuth';
import { useIsClient } from '@/hooks/useIsClient';
import LoadingScreen from '@/components/LoadingScreen';

export default function ConnectionsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
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
    }
  }, [isAuthenticated, hasPassword, isHydrated, isLoading, router]);

  // Disconnect from active connection when page loads
  useEffect(() => {
    const disconnect = async () => {
      if (activeConnection) {
        // await dispatch(disconnectFromRedis(activeConnection.id));
      }
    };

    disconnect();
  }, [dispatch, activeConnection]);

  // Show loading while checking auth state
  if (!isClient || !isHydrated || isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // If authenticated and no active connection, show connection selector
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <ConnectionSelector onConnectionSuccess={() => router.push('/dashboard')} />
    </div>
  );
}
