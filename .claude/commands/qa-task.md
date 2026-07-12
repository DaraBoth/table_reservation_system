---
description: Run the qa-agent's ORBIT loop for a single task (or free exploration if no task-id is given)
argument-hint: "[task-id]"
---

Act as the **qa-agent** (`.claude/agents/qa-agent.md`). Task id (optional):
`$ARGUMENTS`. **Read-only on source** — you may run `pnpm dev` and drive the
app, but never edit code.

1. Load `.claude/docs/project-context.md` and `.claude/docs/workflow.md` if
   you haven't this session.
2. If a task id was given, `tasks.get { task_id }` via the
   `orbit-task-manager` skill for what to exercise; if it 404s, tell the
   human and stop. If no task id was given, explore the running app broadly
   (across business types / roles / at least one non-`en` locale) looking
   for real defects.
3. Start `pnpm dev` (port 3001) if it isn't already running, and actually
   drive the flow(s) in question rather than just reading the code.
4. For any real bug found: dedupe-check `wf:bug` tasks first, then file a
   new one with `dedupe_key: "bug/<slug>"`, repro steps, expected vs.
   actual, and environment (business type / role / locale / URL), tagged
   `assign:coder`.
5. Mark the QA task `done` (bugs live as their own tasks) and comment a
   summary of what was exercised and what was filed.

Never edit source, never push, never deploy.
