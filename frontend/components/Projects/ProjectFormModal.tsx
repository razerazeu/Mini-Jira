'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { Project } from '@/lib/hooks/useProjects';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  teamId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  teams?: Array<{ teamId: string; name: string }>;
  initialData?: Project;
  title?: string;
  submitButtonText?: string;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  teams = [],
  initialData,
  title = 'Create Project',
  submitButtonText = 'Create',
}: ProjectFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      teamId: initialData?.teamId || '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(`Project ${initialData ? 'updated' : 'created'} successfully`);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] rounded-lg shadow-2xl max-w-md w-full border border-gray-800 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Name *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., Website Redesign"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Optional project description..."
              rows={3}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Team Selection */}
          {teams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Team
              </label>
              <select
                {...register('teamId')}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="">No team (available to all)</option>
                {teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-200 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
