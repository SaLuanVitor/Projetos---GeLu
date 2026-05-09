# Gelu - Menu

Base inicial do sistema Gelu - Menu: uma plataforma para organizacao pessoal e familiar de receitas, dietas, treinos, acompanhamento calorico, suporte e sugestoes assistivas com IA.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Java 21, Spring Boot
- Database: PostgreSQL
- Storage local: MinIO
- Deploy inicial: Docker Compose
- IA: modulo interno de orquestracao de agentes

## Estrutura

```text
backend/      API Spring Boot modular
frontend/     App Next.js
infra/        Docker Compose e arquivos de ambiente
AGENTS.md     Guia de uso dos agentes no repositorio
```

## Primeiros comandos

```bash
docker compose -f infra/docker-compose.yml up -d postgres minio
cd backend && mvn spring-boot:run
cd frontend && npm install && npm run dev
```

## Endpoints iniciais

- Backend health: `GET /api/v1/health`
- AI agents catalog: `GET /api/v1/ai/agents`
- OpenAPI JSON: `GET /v3/api-docs`
- Swagger UI: `GET /swagger-ui.html`

## Quality gates

```bash
docker run --rm -v ${PWD}/backend:/app -w /app maven:3.9.9-eclipse-temurin-21 mvn -q test spotless:check
cd frontend && npm run lint && npm run typecheck && npm run format:check && npm run build
docker compose -f infra/docker-compose.yml config --quiet
```

## Ferramentas locais

Arquivos em `.codex/` sao configuracoes/agentes locais do desenvolvedor e nao devem ser enviados para o Git.

Use o agente local `gelu-general-orchestrator-agent` como coordenador padrao para tarefas amplas. Ele deve chamar o otimizador de tokens antes de acionar qualquer agente especializado.

## Documentacao do projeto

- Arquitetura: `docs/architecture.md`
- Plano de sprints: `docs/sprints.md`
