# Dashboard "Platform Refactor" Plan (Global Extraction)

Transition the dashboard into a high-end platform with a unified, global action hub and consistent UI states.

## User Review Required

> [!IMPORTANT]
> **Priority**: I am extracting the **Action Hub** into a global component. This ensures the "Floating Button" is consistent across **Units** and **Reservations** and resolves any layout clipping issues.

## Current Tasks

1.  **Extract `ActionHub.tsx`**: Create a shared component at `src/components/dashboard/ActionHub.tsx`.
2.  **Global FAB Positioning**: Use `fixed bottom-10 right-10 z-[200]` to ensure it's always on top and accessible.
3.  **Units Integration**: Replace local Hub logic in `UnitsClient.tsx` with the shared component.
4.  **Reservations Integration**: Add the Hub to `ReservationsClient.tsx`.
5.  **Audit**: Ensure "Unit/Table" labeling is correct everywhere.

## Verification Plan

- **Visibility**: Confirm FAB is visible on all platforms (iPad/Desktop).
- **Functionality**: Confirm "Add" and "Manage" flows work perfectly through the new Hub.
