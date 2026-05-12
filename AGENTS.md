# Gelu - Menu Agent Usage

Codex agents and skills are local developer tooling for this project. The `.codex/` directory is intentionally ignored and must not be committed.

## How to Use

Before planning or implementing work, pick the most specific locally installed skill or agent for the task:

- General orchestration: `gelu-general-orchestrator-agent`; use it by default for broad tasks and make it call `gelu-token-optimizer-agent` before any other agent.
- Product AI and nutrition flows: `gelu-diet-suggestion-agent`, `gelu-recipe-suggestion-agent`, `gelu-calorie-analysis-agent`, `gelu-training-adjustment-agent`, `gelu-family-meal-planner-agent`
- Development work: `gelu-development-agent`, `gelu-backend-agent`, `gelu-frontend-agent`, `gelu-database-agent`, `gelu-test-agent`
- Operations and docs: `gelu-devops-agent`, `gelu-documentation-agent`, `gelu-ux-agent`
- Prompt/context optimization: `gelu-prompt-optimizer-agent`, `gelu-token-optimizer-agent`
- Support flows: `gelu-support-agent`
- Requirements and stories: `gelu-requirements-agent`

Local skills may point to local agent instructions under `.codex/agents/`. Keep those files on your machine only.

## Project Rules

- `baseSistema/` is local reference material and must remain ignored by Git.
- `.codex/` is local Codex configuration and must remain ignored by Git.
- Broad or multi-agent work must start with the local general orchestrator, which applies token optimization before delegating.
- Keep the project as a modular monolith: Spring Boot backend, Next.js frontend, PostgreSQL, MinIO, Docker Compose.
- Use API base path `/api/v1`.
- Use the response envelope `{ success, data, message }` for success and `{ success, error }` for errors.
- Keep frontend user-facing copy in `next-intl` dictionaries. `pt-BR` is the default locale without a URL prefix and `en` uses `/en`.
- Do not render backend technical error messages directly to users; localize them in the frontend by code/message.
- Keep docs synchronized when changing i18n, auth/session behavior, or the AI agent catalog.
- The backend owns AI orchestration; AI agents do not access the database directly.
- Health endpoints and placeholders are allowed in the base, but new business behavior must be backed by tests.
