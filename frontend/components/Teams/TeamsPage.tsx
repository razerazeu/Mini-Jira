'use client';

import { useState } from 'react';
import { useTeams, Team } from '@/lib/hooks/useTeams';
import { TeamCard } from './TeamCard';
import { TeamFormModal } from './TeamFormModal';
import { DeleteTeamModal } from './DeleteTeamModal';
import { TeamMembersModal } from './TeamMembersModal';
import { Plus, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/AuthContext';

export function TeamsPage() {
  const { isManager } = useAuth();
  
  const { teams, teamMembers, loading, error, createTeam, updateTeam, deleteTeam, fetchTeamMembers, refreshTeams } =
    useTeams();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateTeam = async (data: { name: string; description?: string }) => {
    await createTeam(data);
  };

  const handleEditTeam = async (data: { name: string; description?: string }) => {
    if (!editingTeam) return;
    await updateTeam(editingTeam.teamId || editingTeam.id || '', data);
    setEditingTeam(null);
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    setIsDeleting(true);
    try {
      await deleteTeam(deletingTeam.teamId || deletingTeam.id || '');
      toast.success('Team deleted successfully');
      setDeletingTeam(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewMembers = async (team: Team) => {
    setViewingTeam(team);
    setLoadingMembers(true);
    try {
      await fetchTeamMembers(team.teamId || team.id || '');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-1">
                {teams.length} {teams.length === 1 ? 'team' : 'teams'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refreshTeams()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                title="Refresh teams"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {isManager && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  New Team
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Error loading teams</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
            <button
              onClick={() => refreshTeams()}
              className="text-red-600 hover:text-red-700 font-medium text-sm flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No teams yet</h3>
                <p className="text-gray-600 mt-1">Create your first team to get started</p>
              </div>
              {isManager && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Team
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Teams grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team.teamId || team.id}
                team={team}
                memberCount={
                  teamMembers[team.teamId || team.id || '']?.length || 0
                }
                isManager={isManager}
                onEdit={() => setEditingTeam(team)}
                onDelete={() => setDeletingTeam(team)}
                onViewMembers={() => handleViewMembers(team)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TeamFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTeam}
        title="Create New Team"
        submitButtonText="Create"
      />

      {editingTeam && (
        <TeamFormModal
          isOpen={true}
          onClose={() => setEditingTeam(null)}
          onSubmit={handleEditTeam}
          initialData={editingTeam}
          title="Edit Team"
          submitButtonText="Update"
        />
      )}

      <DeleteTeamModal
        isOpen={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onConfirm={handleDeleteTeam}
        team={deletingTeam}
        isDeleting={isDeleting}
      />

      <TeamMembersModal
        isOpen={!!viewingTeam}
        onClose={() => setViewingTeam(null)}
        team={viewingTeam}
        members={
          viewingTeam ? teamMembers[viewingTeam.teamId || viewingTeam.id || ''] || [] : []
        }
        isLoading={loadingMembers}
      />
    </div>
  );
}
