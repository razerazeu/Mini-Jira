'use client';

import { ShieldAlert } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export function AccessDenied({
  title = 'Access denied',
  message = 'You do not have permission to view this page.',
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-600" />
        <h1 className="mt-4 text-2xl font-semibold text-red-900">{title}</h1>
        <p className="mt-2 text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}