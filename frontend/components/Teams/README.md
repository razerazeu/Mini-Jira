# Teams Feature Documentation

## Overview

The Teams feature allows managers to organize and manage groups of employees, providing a way to structure organizational hierarchy and assign employees to teams for project and task management.

## Features

### 1. Teams List Page

**Location:** `/teams`

Display all teams with comprehensive management capabilities:

- **Team Cards:** Grid view showing team information
- **Member Count:** Display number of team members per team
- **Team Details:** Name, description, and creation date
- **Quick Actions:** View members, edit, and delete (managers only)
- **Loading/Empty/Error States:** Proper feedback for all scenarios

**Components:**
- `TeamsPage`: Main container managing all team operations
- `TeamCard`: Individual team card with statistics and actions
- `TeamFormModal`: Create/edit team form
- `DeleteTeamModal`: Delete confirmation dialog
- `TeamMembersModal`: View team members in a modal

### 2. Create Team Modal

**Features:**
- Team name (required, max 100 characters)
- Team description (optional, max 500 characters)
- Form validation using Zod
- Toast notifications on success/error
- Manager-only access

**Usage:**
```typescript
<TeamFormModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleCreateTeam}
  title="Create New Team"
  submitButtonText="Create"
/>
```

**Form Validation:**
```typescript
const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional().nullable(),
});
```

### 3. Edit Team Modal

Same form as create, but pre-populated with current team data:

```typescript
<TeamFormModal
  isOpen={true}
  onClose={() => setEditingTeam(null)}
  onSubmit={handleEditTeam}
  initialData={editingTeam}
  title="Edit Team"
  submitButtonText="Update"
/>
```

**Editable Fields:**
- Team name
- Team description

### 4. Delete Team Modal

Confirmation dialog with:
- Warning about irreversible action
- Team name display
- Confirmation button
- Manager-only access

**Safety Features:**
- Clear warning message
- Team information preview
- Two-button confirmation flow

### 5. Team Members Modal

View all members assigned to a team:

- List of team members with:
  - Member name and avatar
  - Email address
  - User role (MANAGER/EMPLOYEE) with color-coded badges
  - Icon indicators for roles
- Loading state while fetching members
- Empty state when no members exist
- Scrollable list for large teams

**Features:**
- Real-time member list display
- Role-based visual indicators (Purple for Manager, Blue for Employee)
- Responsive layout
- Professional styling with hover effects

## Hooks

### useTeams

Comprehensive hook for all team data operations:

```typescript
const { 
  teams,              // Array of teams
  teamMembers,        // Record<teamId, TeamMember[]>
  loading,            // Loading state
  error,              // Error message
  createTeam,         // (data) => Promise<Team>
  updateTeam,         // (id, data) => Promise<Team>
  deleteTeam,         // (id) => Promise<void>
  fetchTeamMembers,   // (teamId) => Promise<TeamMember[]>
  refreshTeams        // () => Promise<void>
} = useTeams();
```

**Methods:**

- `createTeam(data)`: Create a new team with name and optional description
- `updateTeam(teamId, data)`: Update team name or description
- `deleteTeam(teamId)`: Delete a team (irreversible)
- `fetchTeamMembers(teamId)`: Fetch members assigned to a team
- `refreshTeams()`: Manually refresh team list from backend

## API Endpoints

```
GET    /api/teams              - List all teams
POST   /api/teams              - Create team (Manager only)
GET    /api/teams/:id          - Get team details
PUT    /api/teams/:id          - Update team (Manager only)
DELETE /api/teams/:id          - Delete team (Manager only)
GET    /api/teams/:id/members  - Get team members
```

## Types

```typescript
export interface Team {
  teamId: string;
  id?: string;
  name: string;
  description?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'EMPLOYEE';
  teamId: string;
  createdAt: string;
  updatedAt: string;
}
```

## UI/UX Features

### Grid View
- Modern card design with gradient headers
- Team name and description display
- Member count with icon
- Creation date
- Quick action buttons
- Responsive layout (1 column on mobile, 2 on tablet, 3 on desktop)

### Loading States
- Spinner with "Loading teams..." message
- Prevents user interaction during load
- Full-screen centered display

### Empty State
- Friendly icon and message
- "No teams yet" headline
- Create button (for managers)
- Clear call to action

### Error State
- Error icon and message
- Specific error text from backend
- Retry button to reload teams
- Dismissible alert style

### Manager-Only Features
Buttons that appear only for users with manager role:
- New Team button (header)
- Edit button (on each team card)
- Delete button (on each team card)

## Permissions

- **Create:** Managers only (checked via `isManager` from AuthContext)
- **Edit:** Managers only
- **Delete:** Managers only
- **View Teams List:** All authenticated users
- **View Team Members:** All authenticated users

## Form Validation

### Team Name
- Required field
- Minimum: 1 character
- Maximum: 100 characters
- Error message: "Team name is required"

### Description
- Optional field
- Maximum: 500 characters
- Can be empty
- Real-time character count feedback

### Backend Validation
- Team name uniqueness check (case-insensitive)
- Duplicate name error: "Team name already exists"

## Error Handling

All operations include comprehensive error handling:

- **Toast notifications** for user feedback
- **Error state** displayed on page
- **Retry mechanisms** for failed operations
- **Specific error messages** from backend
- **Graceful degradation** for network issues

### Common Error Messages
- "Failed to load teams"
- "Failed to create team"
- "Failed to update team"
- "Failed to delete team"
- "Failed to load team members"
- "Team name already exists"
- "Team not found"

## Integration Points

1. **Authentication:** Uses AuthContext to determine user role (manager/employee)
2. **Team Assignment:** Teams can be associated with projects
3. **Team Members:** Users can be assigned to teams via separate assignment modal
4. **Navigation:** Teams page accessible from main navigation
5. **Dashboard:** Team information displayed in user dashboard

## Best Practices

1. **Data Consistency:** Always refresh after mutations
2. **Permission Checks:** Verify user role before showing action buttons
3. **Loading States:** Show spinners during async operations
4. **Validation:** Validate all user input before submission
5. **Error Messages:** Provide clear, actionable error messages
6. **Confirmation:** Require confirmation for destructive actions
7. **Responsive Design:** Ensure works on all screen sizes
8. **Accessibility:** Proper labels and keyboard navigation

## Styling

- **Framework:** Tailwind CSS
- **Icons:** Lucide React
- **Design Patterns:**
  - Gradient backgrounds for visual hierarchy
  - Card-based layout for teams
  - Modal dialogs for forms and confirmations
  - Badge components for roles
  - Color-coded actions (blue for create/edit, red for delete)
  - Hover states and smooth transitions

### Color Scheme
- Primary: Blue (600/700) for actions
- Danger: Red (600/700) for delete
- Roles: Purple for Manager, Blue for Employee
- Backgrounds: Gray gradient (50-100) for surfaces
- Borders: Gray 200-300 for subtle divisions

## Components Hierarchy

```
TeamsPage (Main Container)
├── Header with title and actions
├── Error state (if applicable)
├── TeamCard (repeating for each team)
│   ├── Gradient header
│   ├── Team info section
│   ├── Member count
│   └── Action buttons
├── TeamFormModal (Create/Edit)
├── DeleteTeamModal (Confirmation)
└── TeamMembersModal (View members)
```

## Development Workflow

### Adding a Team
1. User clicks "New Team" button
2. TeamFormModal opens
3. User fills name and optional description
4. Form validates input
5. Backend creates team (with manager check)
6. Teams list refreshes
7. Success toast notification

### Editing a Team
1. User clicks edit icon on team card
2. TeamFormModal opens with pre-filled data
3. User updates fields
4. Form validates input
5. Backend updates team
6. Teams list refreshes
7. Success toast notification

### Deleting a Team
1. User clicks delete icon on team card
2. DeleteTeamModal opens with confirmation
3. User confirms deletion
4. Backend deletes team
5. Teams list updates
6. Success toast notification

### Viewing Team Members
1. User clicks "View Members" on team card
2. TeamMembersModal opens
3. Component fetches members for team
4. Members list displays with roles
5. User can close modal

## File Structure

```
frontend/
├── app/
│   └── teams/
│       └── page.tsx                 # Teams page route
├── components/
│   └── Teams/
│       ├── index.ts                 # Component exports
│       ├── TeamsPage.tsx            # Main container
│       ├── TeamCard.tsx             # Individual team card
│       ├── TeamFormModal.tsx        # Create/edit form
│       ├── DeleteTeamModal.tsx      # Delete confirmation
│       └── TeamMembersModal.tsx     # View members
└── lib/
    └── hooks/
        └── useTeams.ts              # Teams data hook
```

## Future Enhancements

- [ ] Bulk operations (select multiple teams)
- [ ] Team search and filtering
- [ ] Team members assignment from teams page
- [ ] Team activity log/history
- [ ] Team settings/preferences
- [ ] Invite team members via email
- [ ] Team statistics and analytics
- [ ] Export team data
- [ ] Team archive functionality
- [ ] Advanced filtering by creation date, manager, etc.

## Testing Checklist

- [ ] Create team with valid data
- [ ] Create team with empty name (should fail)
- [ ] Create team with duplicate name (should fail)
- [ ] Create team with long description (should validate length)
- [ ] Edit team and verify changes save
- [ ] Delete team and verify removal
- [ ] View team members and verify list displays
- [ ] Verify non-managers cannot create/edit/delete teams
- [ ] Verify error states display correctly
- [ ] Verify empty state displays when no teams exist
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Verify loading states display properly
- [ ] Verify toast notifications appear for all actions
- [ ] Verify redirect to login if not authenticated
