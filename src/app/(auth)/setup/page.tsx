'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useIsClient } from '@/hooks/useIsClient';
import LoadingScreen from '@/components/LoadingScreen';
import PasswordSetup from '@/components/PasswordSetup';

export default function SetupPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { 
    isAuthenticated, 
    isLoading, 
    hasPassword, 
    isHydrated, 
    refreshAuth 
  } = useAuth();

  // Redirect if password is already set
  useEffect(() => {
    if (!isHydrated || isLoading) return;
    
    if (hasPassword) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isHydrated, isLoading, hasPassword, isAuthenticated, router]);

  // Show loading while checking auth state
  if (!isClient || !isHydrated || isLoading || hasPassword) {
    return <LoadingScreen />;
  }

  const handleSetupComplete = async () => {
    await refreshAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Setup Password</h1>
        <p className="text-gray-600 mb-6 text-center">
          Please set up a password to secure your Redis Explorer.
        </p>
        <PasswordSetup onSetupComplete={handleSetupComplete} />
      </div>
    </div>
  );
}
