# Gelu - Menu

Base inicial do sistema Gelu - Menu: uma plataforma para organizacao pessoal e familiar de receitas, dietas, treinos, acompanhamento calorico, suporte e sugestoes assistivas com IA.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, next-intl
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

## Pre-requisitos

- Docker com Docker Compose
- Java 21 e Maven para rodar o backend localmente, ou a imagem Docker Maven usada nos quality gates
- Node.js 22 e npm para rodar o frontend localmente

## Configuracao local

O projeto funciona com valores padrao para desenvolvimento local. Para sobrescrever portas, credenciais locais ou variaveis de ambiente, copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

## Subir dependencias

Use este modo quando quiser rodar backend e frontend fora do Docker, com hot reload das ferramentas locais:

```bash
docker compose -f infra/docker-compose.yml up -d postgres minio
```

Depois suba o backend:

```bash
cd backend && mvn spring-boot:run
```

Em outro terminal, suba o frontend:

```bash
cd frontend && npm install && npm run dev
```

## Subir sistema completo

Para subir PostgreSQL, MinIO, backend e frontend em containers:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Para deixar o ambiente rodando em background:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

## Operacao do ambiente

Ver status dos servicos:

```bash
docker compose -f infra/docker-compose.yml ps
```

Ver logs gerais:

```bash
docker compose -f infra/docker-compose.yml logs -f
```

Ver logs de um servico especifico:

```bash
docker compose -f infra/docker-compose.yml logs -f backend
docker compose -f infra/docker-compose.yml logs -f frontend
docker compose -f infra/docker-compose.yml logs -f postgres
docker compose -f infra/docker-compose.yml logs -f minio
```

Parar containers sem apagar dados locais:

```bash
docker compose -f infra/docker-compose.yml down
```

Recriar imagens sem cache:

```bash
docker compose -f infra/docker-compose.yml build --no-cache
```

## Destruir ambiente local

Este processo para os containers e apaga os dados locais persistidos em `infra/data/postgres` e `infra/data/minio`. Ele nao remove imagens Docker globais da sua maquina.

```bash
docker compose -f infra/docker-compose.yml down --remove-orphans
rm -rf infra/data/postgres infra/data/minio
```

No PowerShell:

```powershell
docker compose -f infra/docker-compose.yml down --remove-orphans
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue infra/data/postgres, infra/data/minio
```

## Endpoints iniciais

- Frontend: `http://localhost:3000`
- Frontend em ingles: `http://localhost:3000/en`
- Backend health: `GET http://localhost:8080/api/v1/health`
- AI agents catalog: `GET http://localhost:8080/api/v1/ai/agents`
- OpenAPI JSON: `GET http://localhost:8080/v3/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- MinIO Console: `http://localhost:9001`
- PostgreSQL: `localhost:5432`

## Localizacao

O frontend usa `next-intl` com `pt-BR` como idioma padrao nas rotas sem prefixo, como `/login`,
`/cadastro`, `/dashboard` e `/perfil`. Ingles usa o prefixo `/en`, como `/en/login`,
`/en/dashboard` e `/en/perfil`.

Toda mensagem exibida ao usuario, inclusive erros retornados pela API, deve respeitar o idioma ativo
e passar pelos dicionarios `next-intl`. Mensagens tecnicas do backend, como `error.code` e
`error.message`, sao contrato de API e nao copy final de interface.

## Autenticacao e sessao

- Cadastro e login usam e-mail e senha.
- O backend emite access token JWT e refresh token.
- O frontend guarda a sessao local em `gelu-menu-session`, renova tokens automaticamente antes da
  expiracao e tenta uma renovacao ao receber 401/403.
- O logout fica no perfil, chama `/api/v1/auth/logout` com o refresh token e limpa a sessao local.
- Reset de senha revoga refresh tokens ativos do usuario; depois disso, o usuario precisa entrar
  novamente.

## Catalogo de agentes de IA

O backend expoe `GET /api/v1/ai/agents` como catalogo tecnico dos agentes disponiveis. A
orquestracao de IA pertence ao backend; agentes nao acessam banco diretamente. Agentes catalogados:

- `diet-suggestion`
- `recipe-suggestion`
- `calorie-analysis`
- `training-adjustment`
- `family-meal-planner`
- `support`
- `prompt-optimizer`
- `token-optimizer`

## Credenciais locais padrao

As credenciais abaixo sao apenas defaults de desenvolvimento local e podem ser sobrescritas via `.env`.

- PostgreSQL database: `gelu_menu`
- PostgreSQL user: `gelu_menu`
- PostgreSQL password: `gelu_menu`
- MinIO user: `gelu_menu`
- MinIO password: `gelu_menu123`

## Quality gates

```bash
docker run --rm -v ${PWD}/backend:/app -w /app maven:3.9.9-eclipse-temurin-21 mvn -q test spotless:check
cd frontend && npm run lint && npm run typecheck && npm run format:check && npm run build
docker compose -f infra/docker-compose.yml config --quiet
```

Teste opcional do frontend:

```bash
cd frontend && npm test
```

## Ferramentas locais

Arquivos em `.codex/` sao configuracoes/agentes locais do desenvolvedor e nao devem ser enviados para o Git.

Use o agente local `gelu-general-orchestrator-agent` como coordenador padrao para tarefas amplas. Ele deve chamar o otimizador de tokens antes de acionar qualquer agente especializado.

`baseSistema/` tambem e material local de referencia e deve permanecer fora do Git.

## Documentacao do projeto

- Arquitetura: `docs/architecture.md`
- Plano de sprints: `docs/sprints.md`
- Infra local: `infra/README.md`
