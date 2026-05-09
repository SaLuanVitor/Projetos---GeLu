# Arquitetura do Sistema - Gelu - Menu

## Objetivo

Descrever a arquitetura base do Gelu - Menu para facilitar manutencao, evolucao, testes e entendimento tecnico.

## Decisao Arquitetural

O Gelu - Menu deve iniciar como um monolito modular.

Essa decisao reduz a complexidade inicial de deploy, comunicacao entre servicos, autenticacao, logs e consistencia de dados. A separacao deve acontecer dentro do codigo, com modulos bem definidos, permitindo extracao futura quando houver necessidade real.

## Stack Oficial

```text
Frontend: Next.js + TypeScript + Tailwind CSS
Backend: Java 21 + Spring Boot
Banco: PostgreSQL
Storage: MinIO em desenvolvimento; S3, Supabase Storage ou MinIO em producao
Autenticacao: Spring Security + JWT + Refresh Token
E-mail: SMTP, Resend, SendGrid ou Amazon SES
Deploy inicial: Docker Compose
IA: modulo interno de orquestracao de agentes
```

## Visao Macro

```text
Usuario
  |
  v
Frontend Next.js
  |
  v
Backend Spring Boot
  |
  +--> PostgreSQL
  +--> Storage de midias
  +--> Servico de e-mail
  +--> Modulo de IA
  +--> Logs e auditoria
```

## Camadas do Backend

```text
Controller
  |
  v
Service
  |
  v
Domain / Business Rules
  |
  v
Repository
  |
  v
PostgreSQL
```

- `Controller`: recebe requisicoes HTTP, valida entrada basica, chama services e retorna DTOs.
- `Service`: aplica regras de negocio, orquestra fluxos, transacoes e integracoes entre modulos.
- `Repository`: concentra acesso ao banco, consultas e persistencia.
- `DTO`: define entrada e saida da API, evitando expor entidades diretamente.

## Modulos Backend

```text
auth
users
recipes
media
family
invitations
diets
meals
training
calories
notifications
support
ratings
suggestions
ai
admin
audit
common
```

## Responsabilidades

| Modulo | Responsabilidade |
| --- | --- |
| auth | Login, JWT, refresh token e recuperacao de senha |
| users | Perfil, dados pessoais, peso e metas |
| recipes | Receitas, ingredientes e preparo |
| media | Upload, URLs, thumbnails e storage |
| family | Ambientes familiares e membros |
| invitations | Convites por e-mail e notificacoes |
| diets | Dietas semanais |
| meals | Refeicoes e associacao de pessoas/receitas |
| training | Treinos e confirmacao diaria |
| calories | Calculos caloricos |
| notifications | Notificacoes internas |
| support | Chamados de suporte |
| ratings | Avaliacoes do sistema |
| suggestions | Sugestoes enviadas por usuarios |
| ai | Sugestoes inteligentes e orquestracao de agentes |
| admin | Administracao do sistema |
| audit | Registro de eventos importantes |
| common | Excecoes, utils, configuracao e seguranca |

## Estrutura Backend

```text
backend/
  src/main/java/br/com/gelu/menu/
    auth/
    users/
    recipes/
    media/
    family/
    invitations/
    diets/
    meals/
    training/
    calories/
    notifications/
    support/
    ratings/
    suggestions/
    ai/
      agents/
      prompts/
      service/
      dto/
    admin/
    audit/
    common/
  src/main/resources/
    application.yml
    db/migration/
```

## Estrutura Frontend

```text
frontend/
  src/
    app/
      login/
      cadastro/
      recuperar-senha/
      dashboard/
      receitas/
      dietas/
      familia/
      treinos/
      perfil/
      ajuda/
      admin/
    components/
      ui/
      layout/
      recipes/
      diets/
      family/
      training/
      support/
    services/
    hooks/
    types/
    utils/
```

## Padrao de API

Base URL:

```text
/api/v1
```

Resposta de sucesso:

```json
{
  "success": true,
  "data": {},
  "message": "Operacao realizada com sucesso"
}
```

Resposta de erro:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos",
    "details": []
  }
}
```

## IA e Agentes

A IA deve ficar isolada no modulo `ai`.

Regras:

- O backend monta o contexto necessario.
- Agentes nao acessam banco diretamente.
- O contexto deve ser minimo e sem dados sensiveis desnecessarios.
- Toda orquestracao deve passar primeiro pelo Token Optimizer local.
- Sugestoes de dieta, calorias e treino devem ser assistivas, nao prescritivas.
- Sugestoes geradas devem ser registradas quando fizer sentido.

Fluxo:

```text
Solicitacao
  -> General Orchestrator Agent
  -> Token Optimizer Agent
  -> Agente especializado
  -> Revisao de formato/seguranca
  -> Resposta final
```

## Deploy Inicial

Servicos do Docker Compose:

```text
frontend
backend
postgres
minio
```

Ambientes planejados:

```text
dev
homolog
prod
```

## Evolucao Futura

Modulos que podem virar servicos separados:

- Media Service
- AI Service
- Notification Service
- Support Service

A extracao so deve ocorrer quando houver necessidade real de escala, isolamento operacional ou manutencao independente.

