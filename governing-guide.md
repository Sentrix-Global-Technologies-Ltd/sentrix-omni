Before proceeding further, establish dashboard engineering rules.

Requirements:

1. The downloaded React template is the design system foundation.
2. Existing template layouts, navigation patterns, spacing rules, typography, theme handling, responsiveness, and component conventions are authoritative.
3. Do not replace template architecture unless there is a documented technical reason.
4. Extend the template rather than rewriting it.

Component Requirements:

All reusable UI elements must live in shared component layers.

Examples:

- Button
- IconButton
- Badge
- StatusBadge
- Table
- DataTable
- EmptyState
- LoadingState
- ErrorState
- Modal
- Drawer
- Tabs
- Form controls
- Search components
- Pagination
- Timeline components
- Realtime indicators

Do not create page-specific implementations when a shared component should exist.

Architecture Requirements:

- Separate UI from business logic.
- Separate API concerns from presentation.
- Use composition over duplication.
- Feature modules may consume shared components but should not redefine them.

Before implementation:

Produce:

1. Component architecture
2. Shared UI architecture
3. Feature module architecture
4. State management boundaries
5. Design system governance

Do not write feature code yet.
