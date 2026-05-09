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
- [ ] Configurar OpenAPI
- [ ] Configurar lint e formatacao completos

Pronto quando:

- [x] Frontend compila
- [x] Backend testa
- [x] Banco sobe localmente
- [x] MinIO sobe localmente
- [x] API healthcheck responde

## Sprint 1 - Autenticacao

Objetivo: implementar cadastro, login e recuperacao de senha.

Tarefas:

- [ ] Criar tabela `refresh_tokens`
- [ ] Criar tabela `password_reset_tokens`
- [ ] Implementar cadastro
- [ ] Implementar login
- [ ] Implementar JWT
- [ ] Implementar refresh token
- [ ] Implementar logout
- [ ] Implementar recuperacao de senha
- [ ] Criar telas de login/cadastro
- [ ] Criar testes de auth

Pronto quando:

- [ ] Usuario cria conta
- [ ] Usuario faz login
- [ ] Usuario renova token
- [ ] Usuario recupera senha
- [ ] Testes passam

## Sprint 2 - Perfil e Peso

Objetivo: permitir gestao de perfil e historico de peso.

Tarefas:

- [ ] Criar endpoint de perfil
- [ ] Criar edicao de perfil
- [ ] Criar tabela `weight_history`
- [ ] Criar registro de peso
- [ ] Criar tela de perfil
- [ ] Criar tela de evolucao
- [ ] Criar lembrete mensal simples
- [ ] Criar testes

Pronto quando:

- [ ] Usuario edita perfil
- [ ] Usuario registra peso
- [ ] Historico aparece
- [ ] Testes passam

## Sprint 3 - Receitas

Objetivo: cadastrar e listar receitas.

Tarefas:

- [ ] Criar tabelas `recipes`, `recipe_ingredients` e `recipe_steps`
- [ ] Criar CRUD de receitas
- [ ] Criar cadastro de ingredientes
- [ ] Criar cadastro de passos
- [ ] Criar filtros basicos
- [ ] Criar tela de listagem
- [ ] Criar tela de cadastro
- [ ] Criar testes

Pronto quando:

- [ ] Receita e criada
- [ ] Receita e editada
- [ ] Receita e listada
- [ ] Busca funciona
- [ ] Testes passam

## Sprint 4 - Midias

Objetivo: permitir imagens e videos de receitas.

Tarefas:

- [ ] Criar tabela `recipe_media`
- [ ] Configurar MinIO/S3 no modulo de media
- [ ] Criar upload de imagem
- [ ] Validar tipo e tamanho
- [ ] Salvar URL no banco
- [ ] Definir imagem principal
- [ ] Permitir URL de video
- [ ] Criar componente `MediaUploader`
- [ ] Criar testes

Pronto quando:

- [ ] Imagem sobe para storage
- [ ] URL e salva
- [ ] Receita exibe imagem
- [ ] Video por URL funciona
- [ ] Testes passam

## Sprint 5 - Ambiente Familiar

Objetivo: criar ambiente familiar e membros.

Tarefas:

- [ ] Criar tabelas `families` e `family_members`
- [ ] Criar CRUD de ambiente familiar
- [ ] Criar permissoes `ADMIN`, `EDITOR` e `VIEWER`
- [ ] Criar tela de familia
- [ ] Criar testes de permissao

Pronto quando:

- [ ] Usuario cria familia
- [ ] Usuario ve membros
- [ ] Permissoes funcionam
- [ ] Testes passam

## Sprint 6 - Convites por E-mail

Objetivo: permitir convidar membros.

Tarefas:

- [ ] Criar tabela `invitations`
- [ ] Criar envio de convite
- [ ] Configurar servico de e-mail
- [ ] Criar tela de convites pendentes
- [ ] Criar aceite
- [ ] Criar recusa
- [ ] Evitar duplicidade
- [ ] Criar testes

Pronto quando:

- [ ] Convite e enviado
- [ ] Convidado visualiza convite
- [ ] Aceite adiciona membro
- [ ] Recusa altera status
- [ ] Testes passam

## Sprint 7 - Dieta Semanal

Objetivo: criar dieta semanal com refeicoes.

Tarefas:

- [ ] Criar tabela `weekly_diets`
- [ ] Criar tabela `diet_meals`
- [ ] Criar tela semanal
- [ ] Adicionar refeicao
- [ ] Editar refeicao
- [ ] Remover refeicao
- [ ] Criar testes

Pronto quando:

- [ ] Dieta semanal e criada
- [ ] Refeicoes aparecem por dia
- [ ] Edicao funciona
- [ ] Testes passam

## Sprint 8 - Associacao de Receitas e Pessoas

Objetivo: associar receitas e pessoas as refeicoes.

Tarefas:

- [ ] Criar `diet_meal_recipes`
- [ ] Criar `diet_meal_people`
- [ ] Selecionar receita na refeicao
- [ ] Selecionar pessoa na refeicao
- [ ] Exibir calorias por refeicao
- [ ] Exibir pessoas associadas
- [ ] Criar testes

Pronto quando:

- [ ] Receita e associada
- [ ] Pessoa e associada
- [ ] Calorias aparecem
- [ ] Testes passam

## Sprint 9 - Treinos e Calculos

Objetivo: implementar treinos, confirmacao diaria e calculo calorico.

Tarefas:

- [ ] Criar tabela `trainings`
- [ ] Criar tabela `training_confirmations`
- [ ] Criar CRUD de treino
- [ ] Criar confirmacao diaria
- [ ] Criar calculo de gasto diario
- [ ] Criar calculo de consumo diario
- [ ] Criar saldo calorico
- [ ] Criar testes

Pronto quando:

- [ ] Treino e cadastrado
- [ ] Treino e confirmado
- [ ] Gasto diario calcula
- [ ] Saldo calorico calcula
- [ ] Testes passam

## Sprint 10 - Ajuda, Suporte e Feedback

Objetivo: criar modulo de ajuda, suporte, avaliacao e sugestoes.

Tarefas:

- [ ] Criar FAQ estatico inicial
- [ ] Criar tabela `support_tickets`
- [ ] Criar tabela `support_messages`
- [ ] Criar tabela `ratings`
- [ ] Criar tabela `user_suggestions`
- [ ] Criar abertura de chamado
- [ ] Criar avaliacao
- [ ] Criar sugestao
- [ ] Criar envio de e-mail para suporte
- [ ] Criar testes

Pronto quando:

- [ ] Usuario abre chamado
- [ ] Usuario avalia
- [ ] Usuario envia sugestao
- [ ] Suporte recebe e-mail
- [ ] Testes passam

## Sprint 11 - IA Basica

Objetivo: criar primeira versao de sugestoes inteligentes.

Tarefas:

- [ ] Criar AI Orchestrator
- [ ] Criar General Orchestrator Agent local
- [ ] Garantir chamada previa do Token Optimizer
- [ ] Criar DietSuggestionAgent
- [ ] Criar CalorieAnalysisAgent
- [ ] Criar tabela `ai_suggestions`
- [ ] Criar endpoint de sugestao
- [ ] Criar tela de sugestoes
- [ ] Criar testes com mock

Pronto quando:

- [ ] IA recebe contexto minimo
- [ ] Token Optimizer reduz/organiza contexto antes da delegacao
- [ ] Sugestao e gerada
- [ ] Sugestao e salva
- [ ] Usuario visualiza sugestao
- [ ] Testes passam

## Sprint 12 - Dashboard Completo

Objetivo: melhorar tela inicial.

Tarefas:

- [ ] Card de refeicoes do dia
- [ ] Card de treino
- [ ] Card de saldo calorico
- [ ] Card de convites
- [ ] Card de peso
- [ ] Card de sugestoes
- [ ] Melhorar responsividade
- [ ] Testes frontend

Pronto quando:

- [ ] Dashboard resume o dia
- [ ] Layout responsivo
- [ ] Dados corretos
- [ ] Testes passam

## Sprint 13 - Administracao

Objetivo: criar painel administrativo basico.

Tarefas:

- [ ] Listar chamados
- [ ] Responder chamados
- [ ] Listar avaliacoes
- [ ] Listar sugestoes
- [ ] Alterar status de sugestoes
- [ ] Criar controle `ADMIN`
- [ ] Criar testes

Pronto quando:

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

