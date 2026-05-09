# Codex Agents

Indice de agentes operacionais do projeto NutriFam/Gelu.

Use estes arquivos como instrucoes de papel, escopo e formato de resposta ao acionar o Codex para tarefas especificas. A pasta `baseSistema/` permanece como referencia local e nao deve ser versionada.

## Agentes de produto

| Agente | Arquivo | Quando usar |
| --- | --- | --- |
| DietSuggestionAgent | `diet_suggestion_agent.md` | Sugestoes assistivas de ajuste alimentar. |
| RecipeSuggestionAgent | `recipe_suggestion_agent.md` | Recomendacao de receitas compativeis com objetivo, calorias e restricoes. |
| CalorieAnalysisAgent | `calorie_analysis_agent.md` | Analise de saldo calorico, deficit, superavit ou equilibrio. |
| TrainingAdjustmentAgent | `training_adjustment_agent.md` | Ajustes considerando treinos previstos, feitos ou nao feitos. |
| FamilyMealPlannerAgent | `family_meal_planner_agent.md` | Planejamento simples de refeicoes familiares. |
| SupportAgent | `support_agent.md` | Classificacao de chamados e resposta preliminar para revisao. |
| PromptOptimizerAgent | `prompt_optimizer_agent.md` | Otimizacao de prompts internos e mensagens do sistema. |
| TokenOptimizerAgent | `token_optimizer_agent.md` | Economia de tokens e compactacao de contexto sem perder sentido. |

## Agentes de desenvolvimento

| Agente | Arquivo | Quando usar |
| --- | --- | --- |
| DevelopmentAgent | `development_agent.md` | Apoio geral de implementacao, revisao e documentacao tecnica. |
| RequirementsAgent | `requirements_agent.md` | Requisitos, regras de negocio, criterios de aceite e tarefas. |
| BackendAgent | `backend_agent.md` | Controllers, services, repositories, entidades e contratos backend. |
| FrontendAgent | `frontend_agent.md` | Telas, componentes, validacoes e integracao com APIs. |
| DatabaseAgent | `database_agent.md` | Modelagem, relacionamentos, indices e migrations Flyway. |
| TestAgent | `test_agent.md` | Testes unitarios, integracao, E2E e massa de teste. |
| DevOpsAgent | `devops_agent.md` | Docker, ambientes, CI/CD e operacao. |
| DocumentationAgent | `documentation_agent.md` | README, OpenAPI, manuais tecnicos e manutencao. |
| UXAgent | `ux_agent.md` | Fluxo, experiencia, consistencia visual e acessibilidade. |

## Regras gerais

- Usar somente o contexto minimo necessario.
- Nao solicitar ou expor senhas, tokens ou dados sensiveis desnecessarios.
- Marcar claramente suposicoes quando faltarem dados.
- Para saude, alimentacao e treino, manter tom assistivo e informativo, sem prescricao profissional.
- Preferir respostas objetivas, com saida estruturada e acionavel.

