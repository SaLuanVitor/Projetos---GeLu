# Infra Gelu - Menu

Docker Compose inicial para desenvolvimento local.

## Subir dependencias

```bash
docker compose -f infra/docker-compose.yml up -d postgres minio
```

## Subir sistema completo

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Servicos

- Frontend: http://localhost:3000
- Backend: http://localhost:8080/api/v1/health
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432
