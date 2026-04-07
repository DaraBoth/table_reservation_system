# "Platform Refactor" Task Tracking

Current focus: Completed.

- [x] Consolidate disparate header actions into the `ActionHub` component logic.
- [x] Implement MUI-style "Speed Dial" elastic expansion for the hub.
- [x] Reposition `ActionHub` to a **Fixed Bottom-Right Global FAB Position**.
- [x] Extract `ActionHub.tsx` to a shared component in `src/components/dashboard/`.
- [x] Integrate global `ActionHub` into `UnitsClient.tsx`.
- [x] Simplify utility bar (remove card wrap, keep only ViewSwitcher).
- [x] Reduce vertical spacing between header and controls.
- [x] Remove redundant `min-h-[5.5rem]` vertical spacer.
- [x] Fix "Base UI" accessibility console error (`nativeButton={false}`).
- [x] Audit terminology across the app for "Unit/Table/Room" accuracy.
- [x] Final visual polish on iPad (Landscape vs Portrait).

## Audit Notes

- Standardized dashboard terminology to use the existing business-type term system instead of scattered hardcoded labels.
- Widened Units, Reservations, and dashboard overview surfaces so iPad landscape makes better use of available width.
- Adjusted grid breakpoints for unit and reservation cards to reduce cramped layouts on tablet.
- Refreshed the implementation plan into a final-audit format for clearer handoff and review.
- Verified the refactor files with editor diagnostics and a targeted ESLint run.
