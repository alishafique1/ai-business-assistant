# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm i` - Install dependencies

## Project Architecture

This is a React TypeScript application built with Vite, using shadcn/ui components and Tailwind CSS. The project is deployed via Lovable platform.

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui components (Radix UI primitives), Tailwind CSS
- **Backend**: Supabase (authentication, database, edge functions)
- **Routing**: React Router DOM
- **State Management**: React Query for server state, React Context for auth
- **Forms**: React Hook Form with Zod validation

### Application Structure

**Core Application Setup:**
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main app component with routing setup
- `src/integrations/supabase/` - Supabase client and type definitions

**Authentication Flow:**
- Uses Supabase authentication with persistent sessions
- `src/hooks/useAuth.tsx` - Auth context provider
- `src/pages/Auth.tsx` - Authentication page
- `src/pages/Onboarding.tsx` - User onboarding flow

**Dashboard Architecture:**
- `src/pages/Dashboard.tsx` - Main business owner dashboard
- `src/pages/ClientDashboard.tsx` - Client-facing dashboard
- `src/components/dashboard/` - Dashboard-specific components (AIAssistant, ExpenseTracker, etc.)

**Landing Page:**
- `src/pages/Index.tsx` - Marketing landing page
- `src/components/` - Landing page sections (HeroSection, FeaturesSection, etc.)

**UI Components:**
- `src/components/ui/` - shadcn/ui components (fully configured)
- `src/components/client/` - Client-specific components (AIChat, DocumentUpload)
- `src/hooks/` - Custom hooks (useAuth, useMobile, useToast)

**Supabase Integration:**
- Database migrations in `supabase/migrations/`
- Edge functions in `supabase/functions/` (ai-chat, ai-document-categorizer)
- Auto-generated types in `src/integrations/supabase/types.ts`

### Key Patterns

**Component Structure:**
- Uses TypeScript with proper type definitions
- shadcn/ui components for consistent styling
- Responsive design with mobile-first approach

**Data Flow:**
- React Query for API state management
- Supabase client for database operations
- Context API for global auth state

**Styling:**
- Tailwind CSS utility classes
- CSS custom properties for theming
- Responsive breakpoints following Tailwind conventions

### Important Notes

- This is a Lovable project - changes can be made via the platform or local development
- Supabase credentials are configured for the project environment
- All custom routes should be added above the catch-all "*" route in App.tsx
- The project uses ESLint for code quality (run `npm run lint` before committing)