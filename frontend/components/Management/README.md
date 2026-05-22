# User Management Feature Documentation

## Overview

The User Management feature allows managers to view all employees, assign them to teams, reassign them to different teams, and remove them from teams. This provides centralized control over team composition and employee-team relationships.

## Features

### 1. User Management Page

**Location:** `/management`

Display all employees with team assignment controls:

- **User List Table:** Shows all employees with their information
- **Search Functionality:** Filter users by name or email
- **Team Assignment:** Dropdown to assign unassigned employees to teams
- **Reassignment:** Ability to move employees to different teams
- **Team Removal:** Option to remove employees from their current team
- **Manager-Only Access:** Hidden from non-manager users
- **Loading/Empty/Error States:** Proper feedback for all scenarios

**Components:**
- `ManagementPage`: Main container managing all user operations
- `UserRow`: Table row component for each employee
- `ReassignTeamModal`: Modal for reassigning users
- `RemoveTeamModal`: Modal for confirming removal from team
- `index.ts`: Component exports

### 2. User Table Features

**Columns:**
- **User Info:** Name and email with avatar
- **Role:** User role badge (MANAGER/EMPLOYEE)
- **Current Team:** Current team assignment or "No team assigned"
- **Actions:** Assign/reassign/remove buttons

**User Row Styling:**
- Avatar with first letter of name
- Hover effects for better interactivity
- Role-based color coding
- Status indicators for team assignment

### 3. Team Assignment (For Unassigned Employees)

When employee has no team:
- **Dropdown selector** showing all available teams
- Select team to assign user
- Immediate assignment on selection
- Toast notification on success

### 4. Team Reassignment Modal

For employees with existing team assignment:

**Features:**
- Shows current team (read-only)
- Lists only available teams (excluding current team)
- Clean form layout
- Confirmation button
- Cancel option

**When available:**
- Only shown if employee has other teams available
- Edit icon button on user row to trigger
- Prevents reassigning to same team

### 5. Team Removal Modal

Confirmation dialog for removing users from teams:

**Features:**
- Warning icon and message
- User information display
- Confirmation required before removal
- Toast notification on success

**When available:**
- Always available for assigned users
- Delete/trash icon button on user row
- Clear warning text about consequences

### 6. Search Functionality

**Capabilities:**
- Real-time search as user types
- Search by user name (case-insensitive)
- Search by email (case-insensitive)
- Combines both fields in search
- Empty state when no results match
- Clear search button for quick reset

## Hooks

### useUserManagement

Comprehensive hook for all user management operations:

```typescript
const { 
  users,                    // Array of all users
  teams,                    // Array of all teams
  loading,                  // Loading state
  error,                    // Error message
  assignUserToTeam,         // (userId, teamId) => Promise<User>
  removeUserFromTeam,       // (userId) => Promise<User>
  reassignUserToTeam,       // (userId, newTeamId) => Promise<User>
  refreshUsers,             // () => Promise<void>
  refreshTeams              // () => Promise<void>
} = useUserManagement();
```

**Methods:**

- `assignUserToTeam(userId, teamId)`: Assign unassigned employee to a team
- `removeUserFromTeam(userId)`: Remove employee from their current team (sets teamId to null)
- `reassignUserToTeam(userId, newTeamId)`: Move employee to a different team
- `refreshUsers()`: Manually refresh users list from backend
- `refreshTeams()`: Manually refresh teams list from backend

## API Endpoints

```
GET    /api/users              - List all users (REQUIRED - needs implementation)
GET    /api/teams              - List all teams (ALREADY EXISTS)
PATCH  /api/users/:userId/team - Assign/reassign/remove user from team (ALREADY EXISTS)
```

### Important Backend Notes

The following endpoints are **REQUIRED** but may need to be implemented:

**GET /api/users** - List all users
- Should return array of users with their current team assignments
- Used to populate the user management table
- May need to filter for employees only on frontend

**PATCH /api/users/:userId/team** - Currently exists but has limitations:
- Only allows assigning users without existing teams
- Current logic: `if (user.teamId) { throw error }`
- **For reassignment to work:** Backend needs modification to support:
  1. Reassigning employees to different teams
  2. Removing users from teams (setting teamId to null)

The frontend assumes these operations are supported. Backend modifications may be needed.

## Types

```typescript
export interface UserWithTeam {
  userId: string;
  id?: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
  teamId?: string | null;
  teamName?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

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
```

## UI/UX Features

### Table View
- Clean, organized table layout
- Horizontal scrolling on small screens
- Hover effects on rows
- Status indicators with color coding
- Responsive action buttons

### Search Interface
- Search icon in input field
- Real-time filtering
- Clear visual feedback
- Empty state message
- Quick clear button

### Manager-Only Features
- Navigation link only visible to managers
- Access denied page for non-managers
- All buttons only shown to managers
- Toast notifications for all actions

### Loading States
- Spinner with message while loading users
- Prevents interaction during operations
- Full-screen centered display

### Empty States
- When no employees exist
- When search returns no results
- Clear message and call-to-action
- Easy reset option

### Error Handling
- Error alert with message and retry button
- Toast notifications for failed operations
- Specific error messages from backend
- Graceful error recovery

## Permissions

- **Access:** Managers only
  - Non-managers see "Access Denied" page
  - Non-managers cannot navigate to URL
- **Assign Users:** Managers only
- **Reassign Users:** Managers only
- **Remove Users:** Managers only
- **View Users:** Managers only (employees cannot access)

## Features by User Type

### For Unassigned Employees
- **Assign Team:** Dropdown to choose first team
- **Reassign:** Not available (no current team)
- **Remove:** Not available (not assigned)

### For Assigned Employees
- **Assign Team:** Not available (already assigned)
- **Reassign:** Edit button (if other teams available)
- **Remove:** Delete/trash button (always available)

### For Managers
- **Cannot be assigned/reassigned/removed**
- Badge shows "Manager - No assignment"
- Action buttons hidden

## Status Indicators

### Role Badges
- **MANAGER:** Purple background with shield icon
- **EMPLOYEE:** Blue background with users icon

### Team Assignment
- **Assigned:** Green badge with team name
- **Unassigned:** Gray text "No team assigned"

### Actions
- **Assign:** Select dropdown
- **Reassign:** Blue edit icon
- **Remove:** Red trash icon

## Workflow Examples

### Assigning a New Employee to a Team

1. Employee appears in table with "No team assigned"
2. Manager clicks dropdown in Actions column
3. Selects desired team from list
4. Employee is immediately assigned
5. Toast notification confirms success
6. User row updates with new team

### Reassigning an Employee to Different Team

1. Employee has current team shown in row
2. Manager clicks edit (pencil) icon
3. ReassignTeamModal opens showing:
   - User information
   - Current team (read-only)
   - Available teams dropdown
4. Manager selects new team
5. Clicks "Reassign" button
6. Modal closes and row updates
7. Toast notification confirms success

### Removing an Employee from Team

1. Employee has team assigned
2. Manager clicks remove (trash) icon
3. RemoveTeamModal opens with confirmation
4. Shows user info and warning
5. Manager confirms by clicking "Remove"
6. User removed from team
7. Toast notification confirms
8. User row shows "No team assigned"

## Integration Points

1. **Authentication:** Uses AuthContext to check manager role
2. **Teams Feature:** Uses existing teams list for assignments
3. **Navigation:** Conditional link visible only to managers
4. **Toast Notifications:** Feedback for all operations
5. **Real-time Updates:** User list updates immediately after changes

## Best Practices

1. **Data Consistency:** Always refresh after mutations
2. **Permission Checks:** Verify manager role before showing page
3. **Loading States:** Show spinners during async operations
4. **Validation:** Confirm destructive actions with modals
5. **Error Messages:** Provide specific, actionable error text
6. **Search Efficiency:** Real-time filtering on client side
7. **Role Filtering:** Only show employees, not managers
8. **Team Availability:** Filter out current team from reassignment options

## Styling

- **Framework:** Tailwind CSS
- **Icons:** Lucide React
- **Design Patterns:**
  - Table-based layout for users
  - Modal dialogs for actions
  - Badge components for roles/teams
  - Search input with icon
  - Responsive design

### Color Scheme
- **Primary:** Blue (600/700) for actions
- **Danger:** Red (600/700) for remove
- **Roles:** Purple for Manager, Blue for Employee
- **Teams:** Green for assigned teams
- **Backgrounds:** Gray gradient (50-100)
- **Borders:** Gray 200-300

## Components Hierarchy

```
ManagementPage (Main Container)
├── Header with title, search, and refresh
├── Error state (if applicable)
├── Empty state (if no employees)
├── User table
│   └── UserRow (repeating for each employee)
│       ├── User info with avatar
│       ├── Role badge
│       ├── Team assignment status
│       └── Action buttons/dropdowns
├── ReassignTeamModal
└── RemoveTeamModal
```

## File Structure

```
frontend/
├── app/
│   └── management/
│       └── page.tsx                 # Management page route
├── components/
│   └── Management/
│       ├── index.ts                 # Component exports
│       ├── ManagementPage.tsx       # Main container
│       ├── UserRow.tsx              # Table row component
│       ├── ReassignTeamModal.tsx    # Reassign modal
│       └── RemoveTeamModal.tsx      # Remove confirmation modal
└── lib/
    └── hooks/
        └── useUserManagement.ts     # User management hook
```

## Future Enhancements

- [ ] Bulk operations (assign multiple users to team)
- [ ] Export user data with team assignments
- [ ] User activity/assignment history
- [ ] Advanced filtering (by team, role, creation date)
- [ ] Pagination for large user lists
- [ ] User creation/deactivation from management page
- [ ] Assignment templates (pre-configured team assignments)
- [ ] Audit log of all assignment changes
- [ ] Team capacity limits
- [ ] Import users from CSV

## Testing Checklist

- [ ] Display all employees in table
- [ ] Search filters users by name
- [ ] Search filters users by email
- [ ] Can assign unassigned employee to team
- [ ] Can reassign employee to different team
- [ ] Can remove employee from team
- [ ] Managers see Management link in navigation
- [ ] Non-managers see "Access Denied" page
- [ ] Non-managers cannot access /management URL
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display when no users
- [ ] Toast notifications appear for all operations
- [ ] Table is responsive on mobile/tablet/desktop
- [ ] Modals work correctly
- [ ] Search clears and shows all users again
- [ ] Refresh button updates users and teams

## Troubleshooting

### "No employees found" when there should be
- Check backend GET /api/users endpoint returns data
- Verify users have role = 'EMPLOYEE'
- Check browser console for API errors

### Assignment dropdown doesn't appear
- Verify employee has no team assigned (teamId is null)
- Check teams list is not empty
- Ensure user has manager role

### API errors when assigning
- Check backend PATCH /api/users/:userId/team endpoint
- May need to handle reassignment logic in backend
- Verify team exists before assignment

### Search not working
- Check search input is focused
- Verify users have name and email fields
- Try clearing and re-typing search term
