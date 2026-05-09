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
.codex/agents Agentes operacionais do Codex
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
