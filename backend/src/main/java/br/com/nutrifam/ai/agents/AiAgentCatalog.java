package br.com.nutrifam.ai.agents;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AiAgentCatalog {

    private final List<AiAgentDescriptor> agents = List.of(
            new AiAgentDescriptor(
                    "diet-suggestion",
                    "DietSuggestionAgent",
                    "Generate assistive diet adjustment suggestions.",
                    List.of("calorie goal", "average intake", "weight history", "confirmed trainings", "restrictions", "preferences"),
                    List.of("short diagnosis", "objective suggestion", "reason", "professional guidance disclaimer"),
                    ".codex/agents/diet_suggestion_agent.md"
            ),
            new AiAgentDescriptor(
                    "recipe-suggestion",
                    "RecipeSuggestionAgent",
                    "Recommend recipes compatible with goals, calories and restrictions.",
                    List.of("goal", "desired calories", "preferred ingredients", "restrictions", "available recipes"),
                    List.of("recommended recipes", "short justification", "estimated calories"),
                    ".codex/agents/recipe_suggestion_agent.md"
            ),
            new AiAgentDescriptor(
                    "calorie-analysis",
                    "CalorieAnalysisAgent",
                    "Analyze calorie balance as surplus, deficit or equilibrium.",
                    List.of("daily intake", "basal expenditure", "confirmed trainings", "weight", "goal"),
                    List.of("simple diagnosis", "balance classification", "adjustment suggestion"),
                    ".codex/agents/calorie_analysis_agent.md"
            ),
            new AiAgentDescriptor(
                    "training-adjustment",
                    "TrainingAdjustmentAgent",
                    "Suggest adjustments for days with or without confirmed training.",
                    List.of("planned trainings", "confirmations", "estimated burn", "daily diet", "goal"),
                    List.of("training day suggestion", "rest day suggestion", "consistency alert"),
                    ".codex/agents/training_adjustment_agent.md"
            ),
            new AiAgentDescriptor(
                    "family-meal-planner",
                    "FamilyMealPlannerAgent",
                    "Help assemble family meal plans.",
                    List.of("family members", "preferences", "restrictions", "available recipes", "approximate goal"),
                    List.of("meals by day", "associated people", "notes"),
                    ".codex/agents/family_meal_planner_agent.md"
            ),
            new AiAgentDescriptor(
                    "support",
                    "SupportAgent",
                    "Classify support tickets and draft preliminary answers.",
                    List.of("subject", "description", "category", "ticket history"),
                    List.of("suggested category", "suggested priority", "draft answer"),
                    ".codex/agents/support_agent.md"
            ),
            new AiAgentDescriptor(
                    "prompt-optimizer",
                    "PromptOptimizerAgent",
                    "Optimize internal prompts and AI requests.",
                    List.of("original text", "goal", "desired output type"),
                    List.of("optimized prompt", "excess diagnosis", "reduced version"),
                    ".codex/agents/prompt_optimizer_agent.md"
            ),
            new AiAgentDescriptor(
                    "token-optimizer",
                    "TokenOptimizerAgent",
                    "Reduce prompts and context while preserving intent and constraints.",
                    List.of("original text", "goal", "output format", "constraints"),
                    List.of("waste diagnosis", "optimized prompt", "applied savings"),
                    ".codex/agents/token_optimizer_agent.md"
            )
    );

    public List<AiAgentDescriptor> listAgents() {
        return agents;
    }
}
