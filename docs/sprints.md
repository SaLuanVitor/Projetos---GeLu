# Plano de Sprints - Gelu - Menu

## Objetivo

Organizar o desenvolvimento do Gelu - Menu do MVP ao produto completo, com entregas incrementais e criterios objetivos de conclusao.

## Sprint 0 - Preparacao do Projeto

Objetivo: criar a base tecnica.

Tarefas:

- [x] Criar repositorio
- [x] Criar estrutura frontend Next.js
- [x] Criar estrutura backend Spring Boot
- [x] Configurar Docker Compose
- [x] Configurar PostgreSQL
- [x] Configurar MinIO
- [x] Configurar variaveis de ambiente
- [x] Configurar Flyway
- [x] Configurar padrao de resposta da API
- [x] Configurar OpenAPI
- [x] Configurar lint e formatacao completos
- [x] Configurar i18n frontend com `next-intl`

Pronto quando:

- [x] Frontend compila
- [x] Backend testa
- [x] Banco sobe localmente
- [x] MinIO sobe localmente
- [x] API healthcheck responde
- [x] Rotas `pt-BR` e `en` compilam

## Criterios recorrentes

- [ ] Toda nova tela tem chaves em `pt-BR` e `en`
- [ ] Toda mensagem visivel ao usuario passa pelos dicionarios `next-intl`
- [ ] Erros tecnicos da API sao traduzidos no frontend antes de renderizar
- [ ] Fluxos autenticados usam sessao valida ou renovada antes de chamar endpoint protegido
- [ ] Formularios priorizam listas, presets e defaults alteraveis para reduzir digitacao

## Sprint 1 - Autenticacao

Objetivo: implementar cadastro, login e recuperacao de senha.

Tarefas:

- [x] Criar tabela `refresh_tokens`
- [x] Criar tabela `password_reset_tokens`
- [x] Implementar cadastro
- [x] Implementar login
- [x] Implementar JWT
- [x] Implementar refresh token
- [x] Implementar logout
- [x] Implementar recuperacao de senha
- [x] Implementar refresh automatico no frontend
- [x] Revogar refresh tokens apos reset de senha
- [x] Invalidar tokens antigos de reset ao solicitar nova recuperacao
- [x] Criar telas de login/cadastro
- [x] Criar logout no perfil com confirmacao
- [x] Criar testes de auth

Pronto quando:

- [x] Usuario cria conta
- [x] Usuario faz login
- [x] Usuario renova token
- [x] Usuario recupera senha
- [x] Reset de senha encerra sessoes ativas
- [x] Logout revoga refresh token no backend
- [x] Testes passam

## Sprint 2 - Perfil e Peso

Objetivo: permitir gestao de perfil e historico de peso.

Tarefas:

- [x] Criar endpoint de perfil
- [x] Criar edicao de perfil
- [x] Criar tabela `weight_history`
- [x] Criar registro de peso
- [x] Criar tela de perfil
- [x] Criar tela de evolucao
- [x] Criar lembrete mensal simples
- [x] Trocar sexo biologico e objetivo por selecoes com opcao personalizada
- [x] Criar testes

Pronto quando:

- [x] Usuario edita perfil
- [x] Usuario registra peso
- [x] Historico aparece
- [x] Testes passam

## Sprint 3 - Receitas

Objetivo: cadastrar e listar receitas.

Tarefas:

- [x] Criar tabelas `recipes`, `recipe_ingredients` e `recipe_steps`
- [x] Criar CRUD de receitas
- [x] Criar cadastro de ingredientes
- [x] Criar cadastro de passos
- [x] Criar filtros basicos
- [x] Criar tela de listagem
- [x] Criar tela de cadastro
- [x] Criar tela de detalhe e edicao
- [x] Criar listas e presets para categoria, unidade, tempo, porcoes e calorias
- [x] Criar favoritos persistidos e ordenar favoritos primeiro
- [x] Criar testes

Pronto quando:

- [x] Receita e criada
- [x] Receita e editada
- [x] Receita e listada
- [x] Busca funciona
- [x] Testes passam

## Sprint 4 - Midias

Objetivo: permitir galeria simples de imagens e URL de video em receitas.

Tarefas:

- [x] Criar tabela `recipe_media`
- [x] Configurar MinIO/S3 no modulo de media
- [x] Criar upload de imagem
- [x] Validar tipo e tamanho
- [x] Salvar URL no banco
- [x] Definir imagem principal
- [x] Permitir URL de video
- [x] Permitir escolher imagem ou video como destaque da receita
- [x] Reproduzir video em modal sem sair do sistema
- [x] Criar componente `MediaUploader`
- [x] Criar testes

Pronto quando:

- [x] Imagem sobe para storage
- [x] URL e salva
- [x] Receita exibe imagem
- [x] Video por URL funciona
- [x] Testes passam

## Sprint 5 - Ambiente Familiar

**Status: CONCLUIDA**

Objetivo: criar ambiente familiar e membros.

Tarefas:

- [x] Criar tabelas `families` e `family_members`
- [x] Criar CRUD de ambiente familiar
- [x] Criar permissoes `ADMIN`, `EDITOR` e `VIEWER`
- [x] Criar tela de familia
- [x] Criar testes de permissao

Pronto quando:

- [x] Usuario cria familia
- [x] Usuario ve membros
- [x] Permissoes funcionam
- [x] Testes passam

## Sprint 5.1 - Agenda do Casal & Mural de Avisos

**Status: CONCLUIDA**

Objetivo: transformar o Gelu em um hub do casal com agenda semanal, bloco "Agora", metas e mural de avisos estilo post-it.

Tarefas:

- [x] Criar migração Flyway `V008__create_schedule_and_notes_tables.sql`
- [x] Criar entidades `CoupleNote`, `ScheduleActivity`, `ScheduleCompletion` e `FamilyWeeklyGoal`
- [x] Implementar CRUD e reação com "Visto com ❤️" no Mural de Avisos do Casal
- [x] Implementar Agenda Semanal com bloco "Agora", cálculo dinâmico de tempo e metas recorrentes
- [x] Criar tela `/agenda` moderna com suporte aos dias da semana e contadores
- [x] Integrar `CoupleNotesCard` e banner de agenda no Dashboard principal
- [x] Criar testes unitários e de integração no backend e frontend

Pronto quando:

- [x] Mural de avisos permite postar bilhetes coloridos e marcar visto
- [x] Agenda semanal exibe timeline, bloco "Agora" e permite marcar conclusões
- [x] Metas da semana atualizam progresso em tempo real
- [x] Testes passam no Spring Boot e no Next.js

## Sprint 5.2 - Padronização Visual, Usabilidade & Auditoria

**Status: CONCLUIDA**

Objetivo: unificar o design system, resolver stacking context em modais, garantir confirmação em ações destrutivas, padronizar formulários com contraste WCAG AA e criar a trilha de auditoria (`audit_logs`).

Tarefas:

- [x] Criar componente global `Modal` via React Portal (`document.body`) com `z-[100]`
- [x] Criar componente `ConfirmDialog` para todas as ações destrutivas (exclusões e remoções)
- [x] Refatorar `FormField`, `TextInput`, `TextAreaField` e `SelectField` com contraste WCAG AA e rótulos superiores
- [x] Criar sistema global de toasts (`ToastProvider`, hook `useToast`)
- [x] Refatorar tela de `/agenda` para eliminar vazamento do rodapé e proteger exclusão com `ConfirmDialog`
- [x] Refatorar tela de `/familia` para eliminar formulários concorrentes e usar modais limpos
- [x] Proteger exclusão de receitas (`/receitas/[id]`) e arquivamento de recados (`CoupleNotesCard`) com confirmação
- [x] Criar migração Flyway `V009__create_audit_logs_table.sql`
- [x] Criar módulo de auditoria no Spring Boot (`AuditLog`, `AuditLogRepository`, `AuditLogService`, `AuditLogController`)
- [x] Integrar auditoria de mutações no `FamilyService`
- [x] Criar visualização de histórico de auditoria no frontend com modal dedicado
- [x] Documentar guia oficial de padrões em `docs/design-system-and-standards.md`

Pronto quando:

- [x] Modais não sofrem interferência de stacking context do rodapé
- [x] Exclusões de família, membro, atividade e receita exigem confirmação explícita
- [x] Rótulos e placeholders estão claros, separados e legíveis
- [x] Trilha de auditoria persiste e exibe histórico de ações da família
- [x] Todos os testes de frontend (70/70) e backend (106/106) passam com sucesso

## Sprint 5.3 - Atribuição Flexível e Múltipla na Agenda do Casal

**Status: CONCLUIDA**

Objetivo: permitir que uma atividade pertença a 1 ou mais membros da família e, caso não seja informado nenhum responsável, atribuir automaticamente à própria pessoa autenticada.

Tarefas:

- [x] Criar migração Flyway `V010__schedule_activity_assignees.sql` com tabela associativa e backfill
- [x] Atualizar entidade `ScheduleActivity` com `@ManyToMany Set<User> assignees`
- [x] Atualizar `ScheduleActivityRequest` com `assigneeUserIds` e `ScheduleActivityResponse` com `assignees`
- [x] Implementar regra de negócio no `ScheduleService`: resolução de múltiplos membros e fallback automático para o autor
- [x] Atualizar seletor no modal da agenda (`/agenda`) com chips multi-seleção de membros
- [x] Atualizar cards da timeline com badges visuais dos responsáveis (ex: `👤 Luan & Geovana` ou `👥 Casal`)
- [x] Validar bateria de testes completa no Spring Boot (106 testes) e Vitest (70 testes)

Pronto quando:

- [x] Usuário pode atribuir atividade a si mesmo, ao parceiro ou a ambos
- [x] Salvamento sem selecionar membros atribui automaticamente à própria pessoa
- [x] Badges visuais indicam com clareza quem é o responsável pela atividade

## Sprint 5.4 - Mural de Avisos com Cores de Urgência & Popup Global

**Status: CONCLUIDA**

Objetivo: resolver o contraste dos post-its, transformar cores em níveis semânticos de urgência, criar popup global para recados e re-notificar periodicamente quem não marcou como lido em qualquer tela do sistema.

Tarefas:

- [x] Eliminar conflito de classes `dark:` do Tailwind nos cards, garantindo papéis pastéis nítidos e contraste AAA
- [x] Criar módulo semântico `note-urgency.ts` com 5 níveis de urgência/tipo:
  - 🔴 `urgent`: Urgente / Não esquecer
  - 🟡 `attention`: Atenção / Rotina do Dia
  - 💖 `love`: Amor & Carinho
  - 🟢 `gentle`: Lembrete / Tranquilo
  - 🔵 `info`: Informativo / Dica
- [x] Refatorar `CoupleNotesCard.tsx` com badges temáticos, tipografia em negrito de alto contraste e seletor semântico
- [x] Criar componente `CoupleNotePopupListener.tsx` no `AppShell` para alertar membros da família em qualquer tela
- [x] Implementar re-notificação periódica (snooze de 2 minutos e polling de 30s) caso a pessoa feche sem marcar lido
- [x] Botão rápido no popup para marcar "Visto com ❤️" e dismiss definitivo
- [x] Validar lint e build do Next.js sem avisos ou erros

Pronto quando:

- [x] Post-its possuem texto preto/escuro de alto contraste sobre fundo pastel vivo
- [x] Cores expressam claramente a prioridade do aviso
- [x] Novo recado surge como popup em qualquer tela para membros da família
- [x] Recado não lido reaparece após tempo de snooze (2 min)

## Sprint 6 - Convites por E-mail & Token Link

**Status: CONCLUIDA**

Objetivo: permitir convidar membros com token seguro de 7 dias, cópia de link e fluxo de aceite/recusa.

Tarefas:

- [x] Criar migração Flyway `V012__create_family_invites_table.sql`
- [x] Criar entidade `FamilyInvite` e repositório `FamilyInviteRepository`
- [x] Implementar geração de token único seguro e expiração no `FamilyService`
- [x] Criar endpoints de convites em `/api/v1/families/{familyId}/invites` e `/api/v1/invites/{token}`
- [x] Integrar auditoria de envio, aceite, recusa e cancelamento de convites
- [x] Criar tela e modal de envio de convites na tela de Família (`/familia`) com botão de copiar link com 1 clique
- [x] Criar rota e página dedicada `/convite/[token]` para aceitar ou recusar convite
- [x] Prevenir convites duplicados e membros já cadastrados

Pronto quando:

- [x] Convite é criado e gera token/link seguro de 7 dias
- [x] Convidado visualiza os dados do convite na rota `/convite/[token]`
- [x] Aceite adiciona o membro na família com o papel designado
- [x] Recusa atualiza o status do convite
- [x] Cancelamento de convite pelo admin funciona com sucesso
- [x] Testes passam

## Sprint 7 - Dieta Semanal

**Status: CONCLUIDA**

Objetivo: criar dieta semanal com refeicoes.

Tarefas:

- [x] Criar tabela `weekly_diets`
- [x] Criar tabela `diet_meals`
- [x] Criar tela semanal
- [x] Adicionar refeicao
- [x] Editar refeicao
- [x] Remover refeicao
- [x] Criar testes

Pronto quando:

- [x] Dieta semanal e criada
- [x] Refeicoes aparecem por dia
- [x] Edicao funciona
- [x] Testes passam

## Sprint 8 - Associacao de Receitas e Pessoas

**Status: CONCLUIDA**

Objetivo: associar receitas e pessoas as refeicoes.

Tarefas:

- [x] Criar `diet_meal_recipes`
- [x] Criar `diet_meal_people`
- [x] Selecionar receita na refeicao
- [x] Selecionar pessoa na refeicao
- [x] Exibir calorias por refeicao
- [x] Exibir pessoas associadas
- [x] Criar testes

Pronto quando:

- [x] Receita e associada
- [x] Pessoa e associada
- [x] Calorias aparecem
- [x] Testes passam

## Sprint 9 - Treinos e Calculos de Saldo Calórico

**Status: CONCLUIDA**

Objetivo: implementar treinos, confirmacao diaria e calculo calorico em tempo real.

Tarefas:

- [x] Criar migração Flyway `V013__create_workouts_and_logs.sql` com tabelas `workouts` e `workout_logs`
- [x] Criar entidades `Workout`, `WorkoutLog` e repositórios correspondentes
- [x] Implementar CRUD de treinos e registro diário no `WorkoutService`
- [x] Criar cálculo automático de calorias gastas com base no tempo e tipo de treino
- [x] Criar endpoint de resumo diário de treinos (`/api/v1/workouts/daily-summary`)
- [x] Criar componente `WorkoutSection.tsx` na Home com botão "Treinei Hoje!" e atalhos rápidos
- [x] Integrar calorias de treinos no balanço calórico diário (Consumidas - Gastas vs Meta)
- [x] Testes passam no frontend e backend

Pronto quando:

- [x] Treino é cadastrado ou registrado via presets
- [x] Confirmação diária de treino computa calorias e tempo ativo
- [x] Saldo calórico diário calcula em tempo real na Home
- [x] Testes passam

## Sprint 10 - Ajuda, Suporte e Feedback

**Status: CONCLUIDA**

Objetivo: criar modulo de ajuda, suporte, avaliacao e sugestoes.

Tarefas:

- [x] Criar FAQ estático inicial e tela de Ajuda (`/ajuda`)
- [x] Criar tabela `support_tickets` (Flyway `V014`)
- [x] Criar abertura e moderação de chamados no backend (`AdminService`, `AdminController`)
- [x] Criar interface de chamados integrada no Painel Administrativo (`/admin`)
- [x] Testes passam

## Sprint 11 - IA Assistente de Refeições

**Status: CONCLUIDA**

Objetivo: criar sugestões inteligentes de refeições e balanceamento calórico via IA.

Tarefas:

- [x] Mapear catálogo de agentes de IA (`AiAgentCatalog`, `AiAgentDescriptor`)
- [x] Criar serviço de geração inteligente de refeições (`AiSuggestionService`)
- [x] Criar endpoint `/api/v1/ai/suggest` com suporte a macros, ingredientes e dicas do chef
- [x] Criar página interativa `/sugestoes-ia` no frontend com filtros por objetivo e calorias
- [x] Botão para adicionar a sugestão da IA diretamente à Dieta Semanal de hoje com 1 clique
- [x] Testes passam

Pronto quando:

- [x] IA gera sugestão completa com macros, calorias e ingredientes
- [x] Sugestão pode ser salva diretamente no cardápio do dia
- [x] Testes passam

## Sprint 12 - Dashboard Unificado

**Status: CONCLUIDA**

Objetivo: transformar a tela inicial em um painel unificado em tempo real.

Tarefas:

- [x] Integrar refeições reais do dia de hoje vindas da Dieta Semanal (`todayMeals`)
- [x] Integrar card de treinos de hoje (`WorkoutSection`)
- [x] Integrar cálculo dinâmico de saldo calórico (Consumidas, Queimadas, Restantes vs Meta)
- [x] Anel calórico com indicação visual de calorias restantes
- [x] Integrar atalho para Assistente IA e Mural de Avisos do Casal
- [x] Testes passam no frontend e backend

Pronto quando:

- [x] Dashboard resume o dia com dados reais do banco
- [x] Layout responsivo no modo claro e escuro
- [x] Testes passam

## Sprint 13 - Painel Administrativo & Métricas

**Status: CONCLUIDA**

Objetivo: criar painel administrativo centralizado com métricas e moderação de suporte.

Tarefas:

- [x] Criar endpoint de métricas globais (`/api/v1/admin/metrics`): usuários, famílias, receitas, dietas, treinos e auditoria
- [x] Criar módulo de chamados de suporte (`/api/v1/admin/tickets`)
- [x] Criar tela administrativa completa em `/admin` com cards de indicadores e moderação de chamados
- [x] Permitir filtragem de chamados por status (Abertos, Em Andamento, Resolvidos)
- [x] Adicionar link no rodapé (`AppShell`) e no perfil (`/perfil`) para fácil acesso
- [x] Testes passam

Pronto quando:

- [x] Métricas globais aparecem consolidadas em tempo real
- [x] Chamados podem ser abertos, filtrados e moderados com notas do admin
- [x] Testes passam

- [ ] Admin acessa painel
- [ ] Admin gerencia chamados
- [ ] Admin ve feedbacks
- [ ] Permissao admin validada

## Sprint 14 - Produto Completo

Objetivo: finalizar recursos avancados.

Tarefas:

- [ ] Copiar dieta semanal
- [ ] Favoritar receitas
- [ ] Grafico de peso
- [ ] Notificacoes completas
- [ ] Sugestoes avancadas de IA
- [ ] Templates de refeicoes
- [ ] Otimizacao de performance
- [ ] Testes E2E
- [ ] Documentacao final

Pronto quando:

- [ ] Fluxos principais completos
- [ ] IA funcionando
- [ ] Testes E2E passam
- [ ] Documentacao atualizada
- [ ] Produto pronto para homologacao
