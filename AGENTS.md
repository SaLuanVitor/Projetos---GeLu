# NutriFam Codex Agents

This repository uses operational Codex agents stored in `.codex/agents/`.

## How to Use

Before planning or implementing work, pick the most specific agent file for the task:

- Product AI and nutrition flows: `.codex/agents/diet_suggestion_agent.md`, `.codex/agents/recipe_suggestion_agent.md`, `.codex/agents/calorie_analysis_agent.md`, `.codex/agents/training_adjustment_agent.md`, `.codex/agents/family_meal_planner_agent.md`
- Development work: `.codex/agents/development_agent.md`, `.codex/agents/backend_agent.md`, `.codex/agents/frontend_agent.md`, `.codex/agents/database_agent.md`, `.codex/agents/test_agent.md`
- Operations and docs: `.codex/agents/devops_agent.md`, `.codex/agents/documentation_agent.md`, `.codex/agents/ux_agent.md`
- Prompt/context optimization: `.codex/agents/prompt_optimizer_agent.md`, `.codex/agents/token_optimizer_agent.md`
- Support flows: `.codex/agents/support_agent.md`
- Requirements and stories: `.codex/agents/requirements_agent.md`

## Project Rules

- `baseSistema/` is local reference material and must remain ignored by Git.
- Keep the project as a modular monolith: Spring Boot backend, Next.js frontend, PostgreSQL, MinIO, Docker Compose.
- Use API base path `/api/v1`.
- Use the response envelope `{ success, data, message }` for success and `{ success, error }` for errors.
- The backend owns AI orchestration; AI agents do not access the database directly.
- Health endpoints and placeholders are allowed in the base, but new business behavior must be backed by tests.

