'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { Team } from '@/lib/hooks/useTeams';

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamFormData) => Promise<void>;
  initialData?: Team;
  title?: string;
  submitButtonText?: string;
}

export function TeamFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Create Team',
  submitButtonText = 'Create',
}: TeamFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: TeamFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(`Team ${initialData ? 'updated' : 'created'} successfully`);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save team');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-neutral-300 hover:text-neutral-100 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-1.5">Team Name *</label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., Frontend Team"
              className="w-full px-4 py-2 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-neutral-800 text-neutral-100 disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-1.5">Description (Optional)</label>
            <textarea
              {...register('description')}
              placeholder="e.g., Responsible for frontend development"
              rows={3}
              className="w-full px-4 py-2 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-neutral-800 text-neutral-100 disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-neutral-100 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
