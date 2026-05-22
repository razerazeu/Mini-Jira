# Projects Feature Documentation

## Overview

The Projects feature allows managers to organize tasks into projects, providing a way to group related work and track progress across multiple tasks.

## Features

### 1. Projects List Page

**Location:** `/projects`

Display all projects with the following capabilities:

- **Grid View:** Cards showing project info with progress bars
- **List View:** Detailed table view of all projects
- **Statistics:** Display total tasks and completed tasks
- **Progress Bar:** Visual representation of task completion
- **Creation Date:** Shows when the project was created

**Components:**
- `ProjectsPage`: Main container
- `ProjectCard`: Individual project card with stats
- `ProjectFormModal`: Create/edit form
- `DeleteProjectModal`: Delete confirmation

### 2. Create Project Modal

**Features:**
- Project name (required)
- Description (optional, up to 500 characters)
- Team association (optional)
- Form validation using Zod
- Toast notifications on success/error

**Usage:**
```typescript
// Automatically handles form submission
<ProjectFormModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleCreateProject}
  title="Create New Project"
  submitButtonText="Create"
/>
```

### 3. Edit Project Modal

Same form as create, but pre-populated with current data.

```typescript
<ProjectFormModal
  isOpen={true}
  onClose={() => setEditingProject(null)}
  onSubmit={handleEditProject}
  initialData={editingProject}
  title="Edit Project"
  submitButtonText="Update"
/>
```

### 4. Delete Project Modal

Confirmation dialog with:
- Project name
- Warning about associated tasks
- Task count display
- Irreversible action warning

### 5. Project Detail Page

**Location:** `/projects/[projectId]`

Shows all tasks for a specific project in a Kanban board view:

- Filtered tasks by project
- Drag-and-drop status updates
- Task detail modal
- Status statistics
- Progress tracking

## Hooks

### useProjects

Manages all project data operations.

```typescript
const { 
  projects,      // Array of projects
  loading,       // Loading state
  error,         // Error message
  createProject, // (data) => Promise<Project>
  updateProject, // (id, data) => Promise<Project>
  deleteProject, // (id) => Promise<void>
  refreshProjects // () => Promise<void>
} = useProjects();
```

## API Endpoints

```
GET    /api/projects              - List all projects
POST   /api/projects              - Create project
GET    /api/projects/:id          - Get project details
PUT    /api/projects/:id          - Update project
DELETE /api/projects/:id          - Delete project
GET    /api/tasks                 - List tasks (filtered by projectId)
```

## Types

```typescript
interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  teamId?: string | null;
  teamName?: string;
  totalTasks?: number;
  completedTasks?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## UI/UX Features

### Grid View
- Modern card design
- Gradient headers
- Progress bars
- Task counts
- Quick actions (view, edit, delete)

### List View
- Compact table format
- Same functionality as grid
- Better for large numbers of projects

### Loading States
- Spinner while loading projects
- Empty state when no projects exist
- Error state with retry button

### Validation
- Project name required and max 100 chars
- Description optional, max 500 chars
- Team selection optional
- Real-time form validation

## Permissions

- **Create:** Managers only (RoleGuard)
- **Edit:** Managers only (RoleGuard)
- **Delete:** Managers only (RoleGuard)
- **View:** All team members

## Status Tracking

Projects track task status through:
- `totalTasks`: Total count of tasks
- `completedTasks`: Count of tasks with DONE status
- Progress percentage calculated as: `(completedTasks / totalTasks) * 100`

## Integration Points

1. **Task Creation:** When a task is created, project's `totalTasks` is incremented
2. **Task Status Update:** When a task moves to DONE, `completedTasks` is incremented
3. **Task Deletion:** When a task is deleted, `totalTasks` is decremented
4. **Dashboard:** Tasks are organized by project
5. **Kanban Board:** Project detail page shows project-filtered tasks

## Styling

- Uses Tailwind CSS for all styling
- Gradient backgrounds for visual depth
- Lucide React icons throughout
- Responsive design for all screen sizes
- Hover states and transitions for interactivity

## Error Handling

All errors are handled with:
- Toast notifications
- User-friendly error messages
- Retry options for failed loads
- Form validation feedback

## Best Practices

1. **Data Consistency:** Always refresh after mutations
2. **Permission Checks:** Verify user role before showing action buttons
3. **Loading States:** Show spinners during async operations
4. **Validation:** Validate all user input before submission
5. **Error Messages:** Provide clear, actionable error messages

## File Structure

```
frontend/
├── components/
│   └── Projects/
│       ├── index.ts
│       ├── ProjectsPage.tsx       # Main projects list
│       ├── ProjectCard.tsx        # Project card component
│       ├── ProjectFormModal.tsx   # Create/edit modal
│       ├── DeleteProjectModal.tsx # Delete confirmation
│       └── ProjectDetailPage.tsx  # Project detail with tasks
├── lib/
│   └── hooks/
│       └── useProjects.ts         # Project data hook
└── app/
    └── projects/
        ├── page.tsx               # /projects route
        └── [projectId]/
            └── page.tsx           # /projects/:id route
```

## Example Usage

### In a Task Creation Form
```typescript
import { useProjects } from '@/lib/hooks/useProjects';

function TaskForm() {
  const { projects } = useProjects();
  
  return (
    <select name="projectId">
      {projects.map(p => (
        <option key={p.projectId} value={p.projectId}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
```

### Navigate to Project
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push(`/projects/${projectId}`);
```

## Future Enhancements

- Project templates
- Bulk task import
- Project archiving
- Custom project categories
- Team-based permissions
- Project analytics and reporting
- Recurring project tasks
