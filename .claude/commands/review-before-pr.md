---
description: Run the code-reviewer agent's ORBIT loop for a single task
argument-hint: <task-id>
---

Act as the **code-reviewer** agent (`.claude/agents/code-reviewer.md`).
Task id: `$ARGUMENTS`. **Read-only — you never edit source.**

1. Load `.claude/docs/project-context.md` and `.claude/docs/workflow.md` if
   you haven't this session.
2. Use the `orbit-task-manager` skill to `tasks.get { task_id: "$ARGUMENTS" }`.
   If it 404s, tell the human and stop.
3. Set `in_progress`, inspect the actual diff (not just the handoff
   comment), check it against the task's acceptance criteria and this
   repo's conventions (Server Actions pattern, i18n coverage across all 5
   locales, `getTerms()` usage, additive migrations only, RLS-scoped vs.
   admin client usage, `extractWallClockTime` for reservation times) plus
   security/perf concerns.
4. **PASS**: `status: "done"` + tag `wf:approved` + approval comment.
   **FAIL**: file a `wf:change-request` task with exact fixes, tagged
   `assign:coder`, and `tasks.deps.add` it as a blocker on the original;
   comment why it failed.
5. Report your PASS/FAIL verdict and reasoning in your final response.

Never edit source files, never push, never deploy.
