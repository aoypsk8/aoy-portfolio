---
name: git-daily
description: Use when user says "flow init", "flow commit", "flow sync", "flow status", "feat start", "bugfix start", "rel start", "hotfix start", "feat done", "bugfix done", "rel done", or "hotfix done". Handles the full daily git flow lifecycle with short trigger phrases.
---

# Git Daily Shortcuts

Full git flow lifecycle in short trigger phrases. Execute immediately — no confirmation needed.

## Trigger Reference

| You type | What happens |
|----------|-------------|
| `flow init` | Initialize git flow, push `main` + `develop` to origin |
| `flow commit` | Stage all → auto conventional commit → push current branch |
| `flow sync` | Pull latest `develop` and rebase current branch on top |
| `flow status` | Show all active feature / bugfix / release / hotfix branches |
| `feat start <name>` | Pull develop → start feature branch → push to origin |
| `bugfix start <name>` | Pull develop → start bugfix branch → push to origin |
| `rel start <version>` | Pull develop → start release branch → push to origin |
| `hotfix start <version>` | Start hotfix off main → push to origin |
| `feat done` | Push feature → merge to develop → push develop → delete local |
| `bugfix done` | Push bugfix → merge to develop → push develop → delete local |
| `rel done` | Push release → merge to main + develop → push all + tags → delete local |
| `hotfix done` | Push hotfix → merge to main + develop → push all + tags → delete local |

---

## `flow init` — Initialize Git Flow

Run once on a new repo before any other command.

```bash
git flow init -d
```

Defaults accepted by `-d`:
- Production branch: `main`
- Development branch: `develop`
- Prefixes: `feature/`, `release/`, `hotfix/`, `bugfix/`

Push both base branches:
```bash
git push --set-upstream origin main
git push --set-upstream origin develop
```

If no remote exists yet: skip push and tell user to run `git remote add origin <url>` first.

---

## `flow commit` — Quick Commit & Push

Run in parallel: `git status`, `git diff HEAD`, `git branch --show-current`

1. `git add -A`
2. Pick ONE conventional commit prefix:

   | Prefix | When to use |
   |--------|-------------|
   | `feat:` | New feature or new endpoint |
   | `fix:` | Bug fix |
   | `enhance:` | Improvement to existing feature |
   | `refactor:` | Code restructure, no behavior change |
   | `docs:` | Documentation only |
   | `chore:` | Build, config, deps, tooling |
   | `test:` | Adding or fixing tests |
   | `style:` | Formatting, linting |

   Format: `<prefix> <what changed, imperative mood>`
   - Good: `feat: add OTP retry limit for mobile login`
   - Bad: `updated files`, `changes`, `wip`

3. Commit:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: your generated message here
   EOF
   )"
   ```
4. Push: `git push origin <current-branch>`
   - No upstream yet? Use: `git push --set-upstream origin <branch>`

5. Report: branch name, commit message used, push result.

If nothing to commit: say so and stop.

---

## `flow sync` — Sync Branch with Latest Develop

Use when your feature or bugfix branch is behind develop. Keeps your branch up to date and avoids large merge conflicts at finish time.

1. Fetch latest from remote:
   ```bash
   git fetch origin
   ```
2. Rebase current branch onto latest develop:
   ```bash
   git rebase origin/develop
   ```
3. Push the rebased branch:
   ```bash
   git push --force-with-lease origin <current-branch>
   ```
   (`--force-with-lease` is safe — it refuses to push if someone else has pushed to the same branch)

4. Report: how many commits were rebased, current branch name.

If rebase conflict: stop, list conflicting files, ask user to resolve then run `git rebase --continue`.

> Only use on `feature/*` or `bugfix/*` branches — never rebase `develop`, `main`, `release/*`, or `hotfix/*`.

---

## `flow status` — View All Active Branches

Shows everything currently in flight at a glance.

```bash
echo "▶ Current branch:" && git branch --show-current
echo "" 
echo "▶ Features:"   && git flow feature list  2>/dev/null || echo "  none"
echo "▶ Bugfixes:"   && git flow bugfix list   2>/dev/null || echo "  none"
echo "▶ Releases:"   && git flow release list  2>/dev/null || echo "  none"
echo "▶ Hotfixes:"   && git flow hotfix list   2>/dev/null || echo "  none"
echo ""
echo "▶ Recent commits (current branch):"
git log --oneline -5
```

Report: display the output cleanly — current branch, all active branches by type, last 5 commits.

---

## `feat start <name>` — Start Feature Branch

Always pull develop first to branch from the latest code.

```bash
git pull origin develop
git flow feature start <name>
git push --set-upstream origin feature/<name>
```

Report: branched from latest develop, `feature/<name>` pushed to origin.

---

## `bugfix start <name>` — Start Bugfix Branch

For bug fixes on `develop` that don't need a full feature branch.

```bash
git pull origin develop
git flow bugfix start <name>
git push --set-upstream origin bugfix/<name>
```

Report: branched from latest develop, `bugfix/<name>` pushed to origin.

---

## `rel start <version>` — Start Release Branch

```bash
git pull origin develop
git flow release start <version>
git push --set-upstream origin release/<version>
```

Report: branched from latest develop, `release/<version>` pushed to origin.

---

## `hotfix start <version>` — Start Hotfix Branch

Hotfix always branches off `main` — for urgent production fixes only.

```bash
git pull origin main
git flow hotfix start <version>
git push --set-upstream origin hotfix/<version>
```

Report: branched from latest main, `hotfix/<version>` pushed to origin.

---

## `feat done` — Finish Feature Branch

Exact order — do not skip steps:

1. **Commit pending changes** — if `git status` shows changes, run `flow commit` first
2. **Push feature branch:**
   ```bash
   git push origin feature/<name>
   ```
3. **Finish feature** (merges to develop, deletes local):
   ```bash
   git flow feature finish <name>
   ```
4. **Push develop:**
   ```bash
   git push origin develop
   ```
5. Report: feature pushed → merged into develop → local branch deleted.

If merge conflict: stop, list conflicting files, ask user to resolve.

---

## `bugfix done` — Finish Bugfix Branch

Exact order — do not skip steps:

1. **Commit pending changes** — if `git status` shows changes, run `flow commit` first
2. **Push bugfix branch:**
   ```bash
   git push origin bugfix/<name>
   ```
3. **Finish bugfix** (merges to develop, deletes local):
   ```bash
   git flow bugfix finish <name>
   ```
4. **Push develop:**
   ```bash
   git push origin develop
   ```
5. Report: bugfix pushed → merged into develop → local branch deleted.

If merge conflict: stop, list conflicting files, ask user to resolve.

---

## `rel done` — Finish Release Branch

Exact order — do not skip steps:

1. **Commit pending changes** — if `git status` shows changes, run `flow commit` first
2. **Push release branch:**
   ```bash
   git push origin release/<version>
   ```
3. **Finish release** (merges to main + develop, creates annotated tag, deletes local):
   ```bash
   git flow release finish -m "Release <version>" <version>
   ```
4. **Push everything:**
   ```bash
   git push origin develop && git push origin main && git push --tags
   ```
5. Report: release pushed → merged into main + develop → tag created → local branch deleted.

If merge conflict: stop, list conflicting files, ask user to resolve.

---

## `hotfix done` — Finish Hotfix Branch

Exact order — do not skip steps:

1. **Commit pending changes** — if `git status` shows changes, run `flow commit` first
2. **Push hotfix branch:**
   ```bash
   git push origin hotfix/<version>
   ```
3. **Finish hotfix** (merges to main + develop, creates annotated tag, deletes local):
   ```bash
   git flow hotfix finish -m "Hotfix <version>" <version>
   ```
4. **Push everything:**
   ```bash
   git push origin develop && git push origin main && git push --tags
   ```
5. Report: hotfix pushed → merged into main + develop → tag created → local branch deleted.

If merge conflict: stop, list conflicting files, ask user to resolve.

---

## Rules

- Execute immediately — never ask for confirmation
- Never force-push (exception: `flow sync` uses `--force-with-lease` which is safe)
- Never delete a branch after a merge conflict
- Always push the branch to origin BEFORE running `git flow finish`
- Always pull the base branch BEFORE running `git flow start`
- Always pass `-m` flag to `git flow finish` on release and hotfix to avoid interactive editor
