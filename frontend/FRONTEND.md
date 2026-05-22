# Mini-Jira Frontend

A modern task management system with team collaboration, project organization, and drag-and-drop Kanban board.

## Features

### 🎯 Dashboard
- **Kanban Board**: Organize tasks by status (To Do, In Progress, In Review, Done)
- **Drag-and-Drop**: Move tasks between statuses with visual feedback
- **Task Overview**: Quick view of task counts by status
- **One-Click Access**: Click any task to view details in a modal

### 📋 Task Management
- **Full Task Details**: Complete task view with all metadata
- **Status Workflow**: TODO → IN_PROGRESS → IN_REVIEW → DONE with optional status change reasons
- **Audit Log**: Full history of all task changes with timestamps
- **Comments**: Add and view comments on tasks with user/role information
- **Image Attachments**: Upload, replace, and manage task images with version history

### 📁 Projects
- **Project Organization**: Group related tasks into projects
- **Project CRUD**: Create, read, update, delete projects
- **Progress Tracking**: Visual progress bar showing completed vs total tasks
- **Project Dashboard**: View all tasks filtered by project in Kanban view

### 👥 Team Collaboration
- **Role-Based Access**: Manager and Employee roles with different permissions
- **Team Isolation**: Each team's data is kept separate and secure
- **Audit Trail**: Track who made what changes and when
- **Activity Log**: See all actions performed by team members

## Tech Stack

- **Framework**: Next.js 16.2.6 with App Router
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom components
- **Icons**: Lucide React 1.16.0
- **Forms**: react-hook-form 7.76.0 with Zod 4.4.3 validation
- **HTTP**: Axios 1.16.1
- **Drag & Drop**: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- **Notifications**: react-hot-toast 2.6.0
- **Auth**: AWS Amplify 6.17.0
- **Date Utils**: date-fns 4.2.1

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend API running at `http://localhost:3000/api` (or configure `NEXT_PUBLIC_API_URL`)

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# AWS Amplify (optional, for authentication)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOLS_ID=your-pool-id
NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID=your-client-id
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── dashboard/                # Main dashboard with Kanban
│   ├── tasks/                    # Task detail pages
│   ├── projects/                 # Project management pages
│   ├── layout.tsx                # Root layout with Navigation
│   ├── page.tsx                  # Home page
│   ├── AuthContext.tsx           # Auth provider
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── Navigation.tsx            # Top navigation bar
│   ├── TaskDetail/               # Task detail components
│   │   ├── TaskDetailPage.tsx    # Full-page task view
│   │   ├── TaskDetailModal.tsx   # Modal task view
│   │   ├── TaskHeader.tsx        # Task metadata
│   │   ├── StatusUpdateSection.tsx
│   │   ├── AuditLogSection.tsx   # Activity history
│   │   ├── CommentsSection.tsx   # Comments thread
│   │   ├── ImageAttachmentsSection.tsx
│   │   └── index.ts
│   │
│   ├── Kanban/                   # Kanban board components
│   │   ├── KanbanBoard.tsx       # Main board
│   │   ├── KanbanColumn.tsx      # Status column
│   │   ├── TaskCard.tsx          # Draggable task card
│   │   └── index.ts
│   │
│   ├── Dashboard/                # Dashboard components
│   │   ├── DashboardPage.tsx     # Main dashboard
│   │   └── index.ts
│   │
│   ├── Projects/                 # Project management
│   │   ├── ProjectsPage.tsx      # Projects list
│   │   ├── ProjectDetailPage.tsx # Project detail
│   │   ├── ProjectCard.tsx       # Project card
│   │   ├── ProjectFormModal.tsx  # Create/edit form
│   │   ├── DeleteProjectModal.tsx # Delete confirmation
│   │   ├── README.md             # Projects documentation
│   │   └── index.ts
│   │
│   └── ui/                       # UI component library
│
├── lib/                          # Utilities and hooks
│   ├── hooks/
│   │   ├── useTask.ts            # Task data management
│   │   ├── useComments.ts        # Comments management
│   │   ├── useActivityLog.ts     # Activity log fetch
│   │   ├── useTaskImages.ts      # Image management
│   │   └── useProjects.ts        # Project data
│   │
│   ├── types.ts                  # TypeScript interfaces
│   ├── formatters.ts             # Formatting utilities
│   └── utils.ts                  # General utilities
│
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

## Key Features Explained

### 1. Dashboard

**Route:** `/dashboard`

Central hub for task management with:
- Kanban board with 4 status columns
- Drag-and-drop to update status
- Task counts by status
- Click task to open detail modal
- Refresh button to reload data

### 2. Task Detail

**Routes:**
- **Modal:** Accessible from Kanban by clicking a task card
- **Full Page:** `/tasks/[taskId]`

Features:
- View all task metadata (title, description, priority, deadline, assignee)
- Update task status with reason tracking
- View complete activity log
- Add and read comments
- Upload, replace, delete task images
- View previous image versions

### 3. Projects

**Routes:**
- **List:** `/projects` - All projects
- **Detail:** `/projects/[projectId]` - Project with filtered tasks

Features:
- Create new projects
- Edit existing projects
- Delete projects (with confirmation)
- View projects in grid or list view
- Track project progress (completed/total tasks)
- View all project tasks in Kanban view
- Update task status within project context

## API Integration

All API endpoints are relative to `NEXT_PUBLIC_API_URL`:

```
Tasks:
  GET    /tasks                    - List all tasks
  POST   /tasks                    - Create task
  GET    /tasks/:id                - Get task detail
  PATCH  /tasks/:id                - Update task
  DELETE /tasks/:id                - Delete task
  PATCH  /tasks/:id/status         - Update task status
  GET    /tasks/:id/activities     - Get activity log
  GET    /tasks/:id/comments       - Get comments
  POST   /tasks/:id/comments       - Add comment
  POST   /tasks/:id/image          - Upload image
  PUT    /tasks/:id/image          - Replace image
  DELETE /tasks/:id/image          - Delete image

Projects:
  GET    /projects                 - List all projects
  POST   /projects                 - Create project
  GET    /projects/:id             - Get project detail
  PUT    /projects/:id             - Update project
  DELETE /projects/:id             - Delete project
```

## Custom Hooks

### useTask(taskId)

```typescript
const { task, loading, error, updateStatus } = useTask(taskId);
```

### useComments(taskId)

```typescript
const { comments, addComment, loading } = useComments(taskId);
```

### useActivityLog(taskId)

```typescript
const { activities, loading } = useActivityLog(taskId);
```

### useTaskImages(taskId)

```typescript
const { 
  currentImage, 
  previousVersions, 
  uploadImage, 
  deleteImage,
  loading 
} = useTaskImages(taskId);
```

### useProjects()

```typescript
const {
  projects,
  loading,
  error,
  createProject,
  updateProject,
  deleteProject,
  refreshProjects
} = useProjects();
```

## Styling

- **Framework**: Tailwind CSS 4 with JIT mode
- **Color Scheme**: Professional blue/gray with status colors
- **Responsive**: Mobile-first responsive design
- **Components**: Pre-built UI components in `components/ui`

### Color Usage

- **Primary**: Blue (`#2563eb`)
- **Success**: Green (`#16a34a`)
- **Warning**: Yellow (`#ea580c`)
- **Error**: Red (`#dc2626`)
- **Priority - High**: Red
- **Priority - Medium**: Yellow
- **Priority - Low**: Green

## Form Validation

All forms use **Zod** for schema validation and **react-hook-form** for management:

```typescript
const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

const form = useForm({ resolver: zodResolver(schema) });
```

## Error Handling

- **HTTP Errors**: Displayed as toast notifications
- **Form Validation**: Real-time feedback below fields
- **Network Errors**: Retry buttons for failed operations
- **Empty States**: Helpful messages when no data available

## State Management

- **Server State**: Managed by custom hooks
- **UI State**: React useState
- **Form State**: react-hook-form
- **Global Auth**: AWS Amplify

## Performance Optimizations

- Code splitting via dynamic imports
- Image optimization
- Memoization of expensive computations
- Efficient re-renders with proper dependencies

## Testing

```bash
npm run test
```

## Troubleshooting

### API Connection Issues

1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check `NEXT_PUBLIC_API_URL` environment variable
3. Look for CORS errors in browser console

### Authentication Errors

1. Verify AWS Amplify configuration
2. Check credentials are correct
3. Look for token expiration in console

### Data Not Loading

1. Check network tab in DevTools
2. Verify API endpoints are correct
3. Check for permission/role issues

## Contributing

When adding new features:

1. Create component in appropriate folder
2. Use TypeScript for type safety
3. Add proper error handling
4. Include loading states
5. Add toast notifications for user feedback
6. Update documentation

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Validation](https://zod.dev)
- [react-hook-form](https://react-hook-form.com)
- [dnd-kit](https://docs.dndkit.com)

## License

This project is part of the Mini-Jira system.
