# AGENTS.md - Coding Guidelines for This Repository

## 4. Key Conventions

**Authentication & Authorization:**
- Supabase Auth with cookie-based SSR implementation
- Use `createClient()` from `@/lib/supabase/client.ts` for client components
- Use `createClient()` from `@/lib/supabase/server.ts` for server components and API routes
- Role-based access: 'coach' and 'leadership' roles defined in profiles table
- Protected routes use middleware/proxy pattern with authentication checks

**Component Patterns:**
- Functional components with TypeScript interfaces
- Use shadcn/ui components from `@/components/ui`
- Consistent prop naming: `className`, `children`, `onSubmit`, `onChange`
- Loading states with Suspense boundaries
- Error boundaries for component error handling

**State Management:**
- Client state: React hooks (useState, useEffect)
- Server state: Supabase client queries with proper error handling
- Form state: Controlled components with validation
- Authentication state: Supabase auth state management

**Styling:**
- Tailwind CSS with CSS variables from `tailwind.config.ts`
- Design tokens in `app/globals.css`
- Responsive design with mobile-first approach
- Dark mode support via `next-themes`

**File Organization:**
- Components in `/components` with subdirectories by feature
- Utilities in `/lib` (reusable functions, database clients)
- Routes in `/app` following Next.js App Router structure
- Database migrations in `/supabase/migrations` with timestamp naming

## 5. Database Schema (Detailed)

**Core Tables and Relationships:**

**`public.profiles` table:**
- Primary key: `id` UUID (references `auth.users.id`)
- Fields: `email`, `full_name`, `role` (enum: 'coach', 'leadership')
- Automatically populated via trigger `on_auth_user_created`
- Row Level Security (RLS) policies:
  - Select: All users can read profiles (needed for coach/client lookups)
  - Update: Users can only update their own profile
  - Insert: Handled by security definer trigger
- Updated via trigger `update_profiles_updated_at`

**`public.clients` table:**
- Primary key: `id` UUID (auto-generated)
- Fields: `name`, `industry`, `coach_id` (references profiles.id)
- Coach-client relationship: Many clients per coach
- RLS policies:
  - Select: Coaches can see their own clients, leadership can see all
  - Insert/Update/Delete: Coaches can only manage their own clients
- Updated via trigger `update_clients_updated_at`
- Index: `idx_clients_coach_id` for performance

**`public.health_checkins` table:**
- Primary key: `id` UUID (auto-generated)
- Foreign keys: `client_id` (references clients.id), `coach_id` (references profiles.id)
- Core assessment fields:
  - `week_of`: DATE (defaults to most recent Friday)
  - `current_score`: INT (1-5 scale)
  - `predictive_score`: INT (1-5 scale)
  - `notes`: TEXT (optional observations)
  - `action_items`: TEXT (required when predictive_score < 5)
- Unique constraint: `UNIQUE(client_id, week_of)` - one check-in per client per week
- RLS policies:
  - Select: Coaches see their own check-ins, leadership sees all
  - Insert/Update/Delete: Coaches can only manage their own check-ins
- Updated via trigger `update_health_checkins_updated_at`
- Indexes for performance:
  - `idx_health_checkins_client_id`
  - `idx_health_checkins_coach_id`
  - `idx_health_checkins_week_of DESC`
  - `idx_health_checkins_scores` (for filtering by score ranges)

**Database Triggers:**
- `update_updated_at_column()`: Generic function to auto-update `updated_at` timestamp
- Applied to all tables: profiles, clients, health_checkins
- `handle_new_user()`: Security definer function to auto-create profile on user signup
- Trigger `on_auth_user_created`: Fires on new user registration

**Security Patterns:**
- Row Level Security (RLS) enabled on all tables
- Role-based access control through profiles.role field
- Security definer functions for privileged operations
- Proper foreign key constraints with CASCADE deletes
- Input validation at database level (CHECK constraints)

**Data Integrity:**
- Foreign key relationships ensure data consistency
- CASCADE deletes maintain referential integrity
- Unique constraints prevent duplicate data
- CHECK constraints enforce score ranges and business rules