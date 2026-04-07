# "Platform Refactor" Task Tracking

Current focus: Audit and terminology.

- [x] Consolidate disparate header actions into the `ActionHub` component logic.
- [x] Implement MUI-style "Speed Dial" elastic expansion for the hub.
- [x] Reposition `ActionHub` to a **Fixed Bottom-Right Global FAB Position**.
- [x] Extract `ActionHub.tsx` to a shared component in `src/components/dashboard/`.
- [x] Integrate global `ActionHub` into `UnitsClient.tsx`.
- [x] Simplify utility bar (remove card wrap, keep only ViewSwitcher).
- [x] Reduce vertical spacing between header and controls.
- [x] Remove redundant `min-h-[5.5rem]` vertical spacer.
- [ ] Audit terminology across the app for "Unit/Table/Room" accuracy.
- [ ] Final visual polish on iPad (Landscape vs Portrait).
