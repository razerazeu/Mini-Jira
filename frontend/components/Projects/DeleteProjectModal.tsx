'use client';

import { useState } from 'react';
import { AlertCircle, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { Project } from '@/lib/hooks/useProjects';

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteProjectModal({
  isOpen,
  project,
  onConfirm,
  onCancel,
}: DeleteProjectModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast.success('Project deleted successfully');
      onCancel();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-[#E4E7EB] bg-red-50">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-[#172B4D]">Delete Project</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[#172B4D]">
            Are you sure you want to delete <strong>{project.name}</strong>?
          </p>
          <p className="text-sm text-[#6B778C]">
            This action cannot be undone. All associated data will be permanently deleted.
          </p>

          {project.totalTasks && project.totalTasks > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ This project has <strong>{project.totalTasks}</strong> task(s). They will also be deleted.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-[#E4E7EB] bg-[#F4F5F7]">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-[#6B778C] border border-[#E4E7EB] rounded-lg hover:bg-white transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            {isDeleting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
