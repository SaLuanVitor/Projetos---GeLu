# Infra Gelu - Menu

Referencia curta de Docker Compose para desenvolvimento local. O guia principal de setup, rotas,
autenticacao, i18n, logs e destruicao de ambiente fica no `README.md` da raiz do projeto.

## Subir dependencias

```bash
docker compose -f infra/docker-compose.yml up -d postgres minio
```

## Subir sistema completo

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Subir sistema completo em background

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

## Logs

```bash
docker compose -f infra/docker-compose.yml logs -f
```

## Parar sem apagar dados

```bash
docker compose -f infra/docker-compose.yml down
```

## Servicos

- Frontend: http://localhost:3000
- Frontend em ingles: http://localhost:3000/en
- Backend: http://localhost:8080/api/v1/health
- Recipe media: http://localhost:8080/api/v1/recipes/{recipeId}/media
- AI agents catalog: http://localhost:8080/api/v1/ai/agents
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432

## Storage local

O backend usa o MinIO local como storage S3 compativel. O bucket padrao de midias e
`gelu-menu-media`, criado pelo backend quando necessario. Imagens de receitas sao servidas por proxy
autenticado da API, nao por URL publica do bucket.
