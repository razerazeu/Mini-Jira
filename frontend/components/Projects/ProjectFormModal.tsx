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
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-[#E4E7EB] text-[#172B4D]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E4E7EB]">
          <h2 className="text-xl font-semibold text-[#172B4D]">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-[#6B778C] hover:text-[#172B4D] disabled:opacity-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-[#6B778C] mb-1.5">
              Project Name *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., Website Redesign"
              className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg text-[#172B4D] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#6B778C] mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Optional project description..."
              rows={3}
              className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg text-[#172B4D] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent resize-none disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Team Selection */}
          {teams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#6B778C] mb-1.5">
                Team
              </label>
              <select
                {...register('teamId')}
                className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent disabled:opacity-50"
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
          <div className="flex gap-3 pt-4 border-t border-[#E4E7EB]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-[#172B4D] bg-white border border-[#E4E7EB] rounded-lg hover:bg-[#F4F5F7] transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
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
