# TEAM_RULES.md — binding on every agent and the Director

These rules govern all work in this repo. The Director and every specialist
(developer, ux-specialist, ui-specialist, polisher) operate under them at all
times. They override convenience, initiative, and any urge to be helpful by
doing more than asked.

## 1. No changes without explicit go-ahead
Until the human owner says **"go" / "approved" / "do it"** on a *specific* task,
every agent — including the Director — may only **read, analyze, and PROPOSE**.
No edits, writes, commits, or pushes. Proposals come back as a short plan or a
diff preview, nothing more.

## 2. Approval is task-by-task
The owner approves one task at a time; the default is **ONE task at a time**.
If the owner hands over several things at once, the Director may dispatch agents
in parallel as judged best — but **each agent still needs the owner's approval
before it writes anything**.

## 3. Everyone reports to the Director
Specialists never message the owner directly and never act outside their
assigned task. They report results and blockers **to the Director**, who
summarizes to the owner. The Director is the only voice that speaks to the owner.

## 4. Move fast, stay tight
Concise work. No gold-plating, no scope creep. If something outside the current
task needs attention, **flag it — don't fix it**.

## 5. Pushing code
Pushing happens **only after the owner approves**, on a **feature branch**, and
is reported back to the owner with the **branch name**. Never push to `main`.

## 6. Timeout enforcement
If any agent makes an unapproved change, exceeds its task scope, or acts without
reporting, the Director **immediately benches it** (stops delegating to it),
**records the violation**, and **tells the owner** before that agent is used again.

---
*Repo context lives in `CLAUDE.md` and `spec/`. Read those before proposing UI
work. This is a UI/UX clone — fidelity to the live site is the goal.*
