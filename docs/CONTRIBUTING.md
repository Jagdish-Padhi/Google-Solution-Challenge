# Contributing Guidelines

This project follows consistent, review-friendly engineering practices so collaboration stays fast and safe.

## 1) Branching Rules

| Rule | Why it matters | Example |
|---|---|---|
| Do not push directly to main | Protects stable branch from accidental breaks | Work on feature/auth-backend, then open PR |
| One branch per focused task | Keeps changes reviewable and easier to revert | bugfix/auth-refresh-bug, docs/setup-guide |
| Keep branch names readable | Helps team understand purpose quickly | feature/scan-ui, chore/deps-update |
| Rebase or sync before opening PR | Reduces merge conflicts and CI surprises | Pull latest main, then re-run tests |

Recommended branch patterns:

- feature/<scope>
- bugfix/<scope>
- hotfix/<scope>
- chore/<scope>
- docs/<scope>
- refactor/<scope>
- test/<scope>

Branch naming examples:

- feature/auth-backend
- bugfix/client-router-build

## 2) Commit Message Standards

### Commit format

<type>(<scope>): <short present-tense summary>

Examples:

- feat(auth): add refresh token rotation endpoint
- fix(scans): handle null platform field in results
- docs(readme): update local setup steps for ml-service

### Commit type table

| Type | Use when | Good example | Avoid |
|---|---|---|---|
| feat | New user-facing or API functionality | feat(assets): add upload endpoint template | feat: stuff |
| fix | Bug fix or regression fix | fix(auth): reject expired refresh tokens | fix bug |
| chore | Maintenance work not affecting product behavior directly | chore(repo): restructure server folders | update files |
| docs | Documentation only changes | docs(contributing): add PR checklist | docs: changes |
| refactor | Code restructuring without behavior change | refactor(routes): split auth and user routers | refactor all |
| test | Add or improve tests | test(matching): add hamming threshold cases | tests |
| ci | CI/CD workflow updates | ci(actions): run lint on pull_request | ci update |
| build | Build system or dependency tooling updates | build(client): pin axios to 1.14.0 | npm stuff |
| perf | Performance optimization | perf(analytics): memoize aggregation pipeline | perf tweaks |
| style | Formatting or style-only updates | style(server): normalize semicolons | formatting |
| revert | Revert a previous commit | revert(auth): revert token cookie change | undo |

### Commit writing rules

| Rule | Do | Do not |
|---|---|---|
| Use present tense | add, fix, update, remove | added, fixed, updated |
| Keep subject short | 50-72 chars preferred | Very long paragraph-style subject |
| Keep one intent per commit | Separate docs and backend logic commits | Mix unrelated changes in one commit |
| Use meaningful scope | auth, scans, ml-service, analytics | misc, temp, random |
| Explain breaking changes in body | Mention migration steps if needed | Hide breaking behavior in subject only |

### Optional body template for non-trivial commits

Why:

- What problem is solved?

What:

- What changed technically?

Risk:

- Any side effects, migration steps, or rollout notes?

## 3) Clean Pull Request Standards

### PR quality checklist

| Category | Minimum standard |
|---|---|
| Scope | PR solves one clear problem |
| Size | Prefer small-to-medium PRs; split very large work |
| Description | Include context, approach, and test evidence |
| Testing | Local checks pass; mention what was run |
| Security | No secrets, tokens, private keys, or env files |
| Compatibility | Mention breaking changes and migration steps |
| Reviewability | Include screenshots/logs for UI or behavior changes |

### PR title conventions

| Good title | Why good |
|---|---|
| feat(auth): add register and login route templates | Specific and scoped |
| fix(client): resolve missing react-router-dom build error | States exact issue and fix |
| docs(contributing): add commit and PR standards | Clearly docs-only |

### PR description template

## Summary

- Short explanation of what changed.

## Problem

- What issue or gap this PR addresses.

## Solution

- Key implementation decisions.

## Testing

- Commands run and outcome.

## Risk and Rollback

- Known risk and how to revert safely.

## Screenshots (if UI)

- Before/after visuals.

## 4) Issue Reporting Best Practices

### Issue quality checklist

| Field | What to include | Example |
|---|---|---|
| Title | Clear outcome or bug statement | Scan status stays queued forever |
| Type | bug, feature, chore, docs, security | bug |
| Context | Where and when issue appears | During Phase 3 scan polling |
| Steps to reproduce | Numbered deterministic steps | 1) Start scan 2) Refresh page 3) Status never updates |
| Expected vs actual | Explicit comparison | Expected completed, got queued |
| Impact | Severity and affected users | Blocks demo flow |
| Evidence | Logs, screenshots, payload snippets | Backend log + API response |
| Definition of done | Acceptance criteria | Status transitions and retries work |

### Priority and severity guide

| Label | Meaning | Typical response |
|---|---|---|
| P0-critical | Security/data-loss/outage | Immediate fix |
| P1-high | Core feature broken | Same day |
| P2-medium | Important but workaround exists | Planned in sprint |
| P3-low | Nice to have or minor polish | Backlog |

### Issue examples

Good bug issue title:

- Bug: GET /api/scans/:id/status never reaches completed for failed scraper retries

Good feature issue title:

- Feature: Add confidence explainability panel in violations evidence modal

## 5) Review and Merge Policy

| Rule | Requirement |
|---|---|
| Reviewer count | At least 1 teammate approval |
| CI status | All required checks green |
| Conflicts | Must be resolved before merge |
| Merge style | Squash merge preferred for clean history |
| Post-merge | Delete merged branch |

## 6) Security and Hygiene Rules

| Rule | Action |
|---|---|
| Never commit secrets | Use env templates only (.env.example) |
| Keep lock files committed | Preserve reproducible installs |
| Keep .gitignore updated | Prevent accidental generated file commits |
| Validate before PR | Run lint/build/tests relevant to your change |

## 7) Quick Real-World Examples

Example A: Add docs only

- Branch: docs/contributing-standards
- Commit: docs(contributing): add commit, PR, and issue best practices tables
- PR title: docs(contributing): formalize team workflow standards

Example B: Fix runtime bug

- Branch: bugfix/client-router-dependency
- Commit: fix(client): install missing react-router-dom dependency
- PR title: fix(client): resolve production build failure from unresolved router import

Example C: Maintenance cleanup

- Branch: chore/server-model-cleanup
- Commit: chore(server): remove duplicate user model file
- PR title: chore(server): keep organization model as canonical source
