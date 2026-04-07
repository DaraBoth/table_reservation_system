# Dashboard Platform Refactor

Refactor the dashboard into a unified platform surface with one global action hub, consistent business-type terminology, and cleaner tablet behavior across monitoring and reservations views.

## Final Audit Snapshot

> [!NOTE]
> Current phase: final audit and polish.

| Area | Outcome |
| --- | --- |
| Global action pattern | Shared ActionHub now drives Units and Reservations actions |
| Terminology system | Dashboard surfaces align to business-type terms for tables vs rooms and bookings vs reservations |
| Tablet experience | Wider content rails and denser responsive grids improve iPad portrait and landscape balance |
| Remaining work | Completed |

## Completed Refactor Work

1. Extracted the shared ActionHub to `src/components/dashboard/ActionHub.tsx`.
2. Moved the floating action pattern into a global bottom-right FAB flow.
3. Integrated the hub into Units and Reservations.
4. Simplified the utility bar so view switching stays visible without extra chrome.
5. Removed redundant spacing and resolved the Base UI accessibility warning.

## Final Audit Focus

1. Terminology audit: remove hardcoded dashboard labels where business type already provides the correct wording.
2. Tablet polish: make iPad portrait and landscape layouts feel less compressed and better use available width.
3. Regression check: confirm all action-hub entry points still open the correct flows.

## Verification Checklist

- [x] Confirm Units and Reservations render the correct labels for restaurant and hotel business types.
- [x] Confirm tablet layouts expand cleanly on iPad landscape without oversized empty margins.
- [x] Confirm the FAB remains reachable and visually stable while scrolling.
- [x] Confirm Add, Manage, and Reports actions still navigate or open dialogs correctly.

## Verification Result

Targeted editor diagnostics are clean for the dashboard files changed by this refactor, and the targeted ESLint run for those files completes without output.
