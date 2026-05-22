'use client';

import { useState } from 'react';
import Sidebar from './sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 p-6 bg-neutral-900">
          {children}
        </main>
      </div>
    </div>
  );
}
