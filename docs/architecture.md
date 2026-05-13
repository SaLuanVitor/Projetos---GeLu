# Arquitetura do Sistema - Gelu - Menu

## Objetivo

Descrever a arquitetura base do Gelu - Menu para facilitar manutencao, evolucao, testes e entendimento tecnico.

## Decisao Arquitetural

O Gelu - Menu deve iniciar como um monolito modular.

Essa decisao reduz a complexidade inicial de deploy, comunicacao entre servicos, autenticacao, logs e consistencia de dados. A separacao deve acontecer dentro do codigo, com modulos bem definidos, permitindo extracao futura quando houver necessidade real.

## Stack Oficial

```text
Frontend: Next.js + TypeScript + Tailwind CSS + next-intl
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

| Modulo        | Responsabilidade                                    |
| ------------- | --------------------------------------------------- |
| auth          | Login, JWT, refresh token e recuperacao de senha    |
| users         | Perfil, dados pessoais, peso e metas                |
| recipes       | Receitas do usuario, ingredientes, passos e filtros |
| media         | Upload, URLs, thumbnails e storage                  |
| family        | Ambientes familiares e membros                      |
| invitations   | Convites por e-mail e notificacoes                  |
| diets         | Dietas semanais                                     |
| meals         | Refeicoes e associacao de pessoas/receitas          |
| training      | Treinos e confirmacao diaria                        |
| calories      | Calculos caloricos                                  |
| notifications | Notificacoes internas                               |
| support       | Chamados de suporte                                 |
| ratings       | Avaliacoes do sistema                               |
| suggestions   | Sugestoes enviadas por usuarios                     |
| ai            | Sugestoes inteligentes e orquestracao de agentes    |
| admin         | Administracao do sistema                            |
| audit         | Registro de eventos importantes                     |
| common        | Excecoes, utils, configuracao e seguranca           |

## Estrutura Backend

```text
backend/
  src/main/java/br/com/gelu/menu/
    auth/
    users/
    recipes/
      dto/
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
      [locale]/
        login/
        cadastro/
        recuperar-senha/
        redefinir-senha/
        ajuda-acesso/
        dashboard/
        receitas/
        dieta-semanal/
        familia/
        perfil/
        ajuda/
        sugestoes-ia/
      globals.css
    components/
      i18n/
      ui/
      layout/
    i18n/
      navigation.ts
      request.ts
      routing.ts
    messages/
      pt-BR.json
      en.json
    services/
    types/
    middleware.ts
```

As telas publicas de autenticacao (`/login`, `/cadastro`, `/recuperar-senha`,
`/redefinir-senha` e `/ajuda-acesso`) usam um layout proprio de caderno/folha de receita, sem menu
interno. A area autenticada usa `AppShell`, com navegacao completa e inicio em `/dashboard`.

Rotas em portugues usam o locale padrao `pt-BR` sem prefixo de URL. Rotas em ingles usam `/en`. A
configuracao de roteamento fica em `src/i18n/routing.ts` com prefixo `as-needed`. Exemplos:
`/login`, `/dashboard`, `/perfil`, `/en/login`, `/en/dashboard` e `/en/perfil`.

Abrir `/login` ou `/en/login` sempre deve exibir a tela publica de login, mesmo quando existir
sessao local. O frontend so deve enviar o usuario para a area interna depois de um submit de login
bem-sucedido ou ao acessar explicitamente uma rota interna com sessao valida.

## Autenticacao e sessao segura

Cadastro e login usam e-mail e senha. O backend emite access token JWT e refresh token. O frontend
guarda a sessao local em `gelu-menu-session` e usa helpers compartilhados para carregar uma sessao
valida antes de chamar endpoints protegidos.

Regras:

- O access token autoriza chamadas protegidas via Bearer JWT.
- O refresh token renova a sessao antes da expiracao e tambem como fallback unico apos 401/403.
- Se o refresh falhar, o frontend remove `gelu-menu-session` e redireciona para `/login` no locale
  ativo.
- O logout fica na pagina de perfil, chama `/api/v1/auth/logout` com o refresh token e limpa a
  sessao local mesmo se a chamada remota falhar.
- A redefinicao de senha marca o token de reset como usado e revoga refresh tokens ativos do usuario.
- Ao solicitar nova recuperacao de senha, tokens de reset anteriores nao usados deixam de ser
  validos.

O backend continua sendo a fonte de autorizacao via Bearer JWT.

## Localizacao e mensagens ao usuario

O frontend usa `next-intl` com `pt-BR` como idioma padrao sem prefixo de URL e `en` com prefixo
`/en`. Toda copy visivel ao usuario deve sair de `src/messages/pt-BR.json` e
`src/messages/en.json`, incluindo erros, validacoes, estados vazios e textos de acessibilidade.

Mensagens e codigos retornados pelo backend (`error.code`, `error.message`, `details`) sao contrato
tecnico para integracao e diagnostico, nao copy final de interface. Antes de renderizar erros da API,
as telas devem traduzir a mensagem por `error.code` e por mensagens conhecidas usando o helper de
localizacao do frontend. Novas telas nao devem exibir `ApiClientError.message` diretamente ao
usuario.

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

## Modulo de receitas

O modulo `recipes` pertence ao usuario autenticado. Cada receita fica vinculada a `users.id` e tem
ingredientes e passos persistidos em tabelas filhas com cascade no delete.

Tabelas:

- `recipes`
- `recipe_ingredients`
- `recipe_steps`

Endpoints protegidos:

- `GET /api/v1/recipes`
- `POST /api/v1/recipes`
- `GET /api/v1/recipes/{id}`
- `PUT /api/v1/recipes/{id}`
- `DELETE /api/v1/recipes/{id}`

Filtros da listagem: `query`, `ingredient`, `category`, `maxPrepTimeMinutes` e `maxCalories`.
Favoritos, tags e associacao com dieta semanal ficam para sprints futuras.

## Modulo de midias

O modulo de midias usa storage compativel com S3. Em desenvolvimento, o Docker Compose sobe MinIO.
As imagens de receitas ficam em bucket privado e sao servidas ao frontend por proxy autenticado do
backend.

Tabela:

- `recipe_media`

Endpoints protegidos:

- `POST /api/v1/recipes/{recipeId}/media`
- `GET /api/v1/recipes/{recipeId}/media`
- `PUT /api/v1/recipes/{recipeId}/media/{mediaId}/main`
- `DELETE /api/v1/recipes/{recipeId}/media/{mediaId}`
- `GET /api/v1/recipes/{recipeId}/media/{mediaId}/content`

Regras:

- Somente o usuario dono da receita acessa ou altera as imagens.
- Tipos aceitos: `image/jpeg`, `image/png` e `image/webp`.
- Tamanho maximo inicial: 5 MB por imagem.
- Cada receita pode ter multiplas imagens e no maximo uma imagem principal.
- `RecipeResponse` inclui `media` e `mainImageUrl`.
- Video continua como `videoUrl` externa da receita; upload de video fica fora da Sprint 4.

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

Catalogo tecnico exposto em `GET /api/v1/ai/agents`:

| Key                   | Agente                  | Finalidade                                               |
| --------------------- | ----------------------- | -------------------------------------------------------- |
| `diet-suggestion`     | DietSuggestionAgent     | Sugestoes assistivas de ajuste de dieta                  |
| `recipe-suggestion`   | RecipeSuggestionAgent   | Recomendacao de receitas por meta, calorias e restricoes |
| `calorie-analysis`    | CalorieAnalysisAgent    | Analise de saldo calorico                                |
| `training-adjustment` | TrainingAdjustmentAgent | Ajustes para dias com ou sem treino confirmado           |
| `family-meal-planner` | FamilyMealPlannerAgent  | Apoio ao planejamento de refeicoes familiares            |
| `support`             | SupportAgent            | Classificacao e rascunho de respostas de suporte         |
| `prompt-optimizer`    | PromptOptimizerAgent    | Otimizacao de prompts internos                           |
| `token-optimizer`     | TokenOptimizerAgent     | Reducao de contexto preservando intencao e restricoes    |

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
