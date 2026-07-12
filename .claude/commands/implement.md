---
description: Run the coder agent's ORBIT loop for a single task
argument-hint: <task-id>
---

Act as the **coder** agent (`.claude/agents/coder.md`). Task id: `$ARGUMENTS`.

1. Load `.claude/docs/project-context.md` and `.claude/docs/workflow.md` if
   you haven't this session.
2. Use the `orbit-task-manager` skill to `tasks.get { task_id: "$ARGUMENTS" }`.
   If it 404s, tell the human and stop.
3. Follow `coder.md`'s loop for this one task: set `in_progress`, implement
   to the checklist matching this repo's conventions, run `pnpm lint` /
   `pnpm build` / `pnpm i18n:audit` as applicable, check off checklist
   items, hand off to `in_review` + `assign:code-reviewer` (or `done` if no
   reviewer is in this workflow), and leave a handoff comment.
4. If blocked on a human-only decision, file the `[NEEDS-HUMAN]` escalation
   per `workflow.md` instead of guessing, and say so plainly in your final
   response.

Never push, deploy, or force any git/ORBIT operation.
