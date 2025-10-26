'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useIsClient } from '@/hooks/useIsClient';
import LoadingScreen from '@/components/LoadingScreen';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { 
    isAuthenticated, 
    isLoading, 
    hasPassword, 
    isHydrated, 
    refreshAuth 
  } = useAuth();

  // Redirect based on auth state
  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!hasPassword) {
      router.replace('/setup');
    } else if (isAuthenticated) {
      router.replace('/connections');
    }
  }, [isAuthenticated, hasPassword, isHydrated, isLoading, router]);

  // Show loading while checking auth state
  if (!isClient || !isHydrated || isLoading || !hasPassword || isAuthenticated) {
    return <LoadingScreen />;
  }

  const handleLoginSuccess = async () => {
    await refreshAuth();
    router.push('/connections');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
