'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';
import { LayoutDashboard, FolderOpen, Users, Settings, LogOut, Shield, Plus } from 'lucide-react';

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
  ];

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-[#0d0d0d] border-r border-gray-800 transition-all duration-300 flex flex-col h-screen`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && <span className="text-white font-semibold text-lg">Mini<span className="text-blue-500">-Jira</span></span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-white text-lg">
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-white text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">{isManager ? 'Manager' : 'Employee'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {baseItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  pathname === item.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
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
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
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
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="w-6 text-center"><Settings className="w-5 h-5" /></span>
              {!collapsed && <span>Settings</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition text-gray-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <span className="w-6 text-center"><LogOut className="w-5 h-5" /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}