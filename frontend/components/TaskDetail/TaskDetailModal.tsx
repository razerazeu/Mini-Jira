'use client';

import { Task } from '@/lib/types';
import { X } from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, isOpen, onClose }: TaskDetailModalProps) {
  if (!isOpen || !taskId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#E4E7EB] sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-[#172B4D]">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F5F7] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center text-[#6B778C]">
            <p>Task ID: {taskId}</p>
            <p className="text-sm mt-2">Task detail view - more features coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
