'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';
import { LayoutDashboard, FolderOpen, Users, Settings, LogOut, Shield, Plus, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isManager, logout } = useAuth();

  // Don't show sidebar on login or signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const baseItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FolderOpen className="w-5 h-5" />, label: 'Projects', path: '/projects' },
    { icon: <Users className="w-5 h-5" />, label: 'Teams', path: '/teams' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
  ];

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-[#E4E7EB] transition-all duration-300 flex flex-col h-screen sticky top-0 shrink-0`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#E4E7EB]">
        {!collapsed && <img src="/Logo.png" alt="Mini Jira" className="h-16 -ml-8 w-auto" />}
        <button onClick={() => setCollapsed(!collapsed)} className="text-[#6B778C] hover:text-[#172B4D]">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Info */}
      <div className="p-3 border-b border-[#E4E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-[#172B4D] text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-[#6B778C]">{isManager ? 'Manager' : 'Employee'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {baseItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  pathname === item.path
                    ? 'bg-[#F4F5F7] text-[#0052CC]'
                    : 'text-[#6B778C] hover:text-[#172B4D] hover:bg-[#F4F5F7]'
                }`}
              >
                <span className="w-6 text-center">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}

          {/* Manager-only link */}
          {isManager && (
            <li>
              <button
                onClick={() => router.push('/management')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  pathname === '/management'
                    ? 'bg-[#F4F5F7] text-[#0052CC]'
                    : 'text-[#6B778C] hover:text-[#172B4D] hover:bg-[#F4F5F7]'
                }`}
              >
                <span className="w-6 text-center"><Shield className="w-5 h-5" /></span>
                {!collapsed && <span>Management</span>}
              </button>
            </li>
          )}

          {/* Settings */}
          <li>
            <button
              onClick={() => router.push('/settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                pathname === '/settings'
                  ? 'bg-[#F4F5F7] text-[#0052CC]'
                  : 'text-[#6B778C] hover:text-[#172B4D] hover:bg-[#F4F5F7]'
              }`}
            >
              <span className="w-6 text-center"><Settings className="w-5 h-5" /></span>
              {!collapsed && <span>Settings</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-3 border-t border-[#E4E7EB]">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition text-[#6B778C] hover:text-red-600 hover:bg-red-50"
        >
          <span className="w-6 text-center"><LogOut className="w-5 h-5" /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}