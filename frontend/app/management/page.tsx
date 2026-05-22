'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';
import { ManagementPage } from '@/components/Management';
import { AccessDenied } from '@/components/AccessDenied';

export default function Page() {
  const router = useRouter();
  const { user, isManager, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isManager) {
    return <AccessDenied title="Managers only" message="Only managers can access user management." />;
  }

  return <ManagementPage />;
}
