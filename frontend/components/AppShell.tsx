'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';

const NO_CHROME_ROUTES = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  if (NO_CHROME_ROUTES.includes(pathname)) {
    return <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 bg-[#F7F8FA] min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
