'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  
  useEffect(() => {
    if (loading) {
      return;
    }

    router.push(token ? '/dashboard' : '/login');
  }, [router, token, loading]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
