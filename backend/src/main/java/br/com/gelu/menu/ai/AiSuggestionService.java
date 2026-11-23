package br.com.gelu.menu.ai;

import br.com.gelu.menu.admin.AiUsageLog;
import br.com.gelu.menu.admin.AiUsageLogRepository;
import br.com.gelu.menu.admin.SystemSetting;
import br.com.gelu.menu.admin.SystemSettingRepository;
import br.com.gelu.menu.ai.dto.FamilyScopeSummary;
import br.com.gelu.menu.ai.dto.GenerateSuggestionRequest;
import br.com.gelu.menu.ai.dto.MealSuggestionResponse;
import br.com.gelu.menu.ai.dto.MemberWeeklySummary;
import br.com.gelu.menu.ai.dto.NutritionEstimateRequest;
import br.com.gelu.menu.ai.dto.NutritionEstimateResponse;
import br.com.gelu.menu.ai.dto.NutritionIngredientItem;
import br.com.gelu.menu.ai.dto.WeeklyEvolutionSummaryResponse;
import br.com.gelu.menu.ai.dto.WeeklySummaryRequest;
import br.com.gelu.menu.ai.dto.WorkoutCalorieEstimateRequest;
import br.com.gelu.menu.ai.dto.WorkoutCalorieEstimateResponse;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.schedule.ScheduleActivity;
import br.com.gelu.menu.schedule.ScheduleActivityRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import br.com.gelu.menu.users.WeightHistory;
import br.com.gelu.menu.users.WeightHistoryRepository;
import br.com.gelu.menu.workouts.WorkoutLog;
import br.com.gelu.menu.workouts.WorkoutLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiSuggestionService {

  private final SystemSettingRepository systemSettingRepository;
  private final AiUsageLogRepository aiUsageLogRepository;
  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final WeightHistoryRepository weightHistoryRepository;
  private final WorkoutLogRepository workoutLogRepository;
  private final ScheduleActivityRepository scheduleActivityRepository;
  private final ObjectMapper objectMapper;
  private final String superAdminEmail;
  private final java.util.Map<String, CachedAiItem> aiCache =
      new java.util.concurrent.ConcurrentHashMap<>();

  private static class CachedAiItem {
    final Object value;
    final long timestamp;

    CachedAiItem(Object value) {
      this.value = value;
      this.timestamp = System.currentTimeMillis();
    }

    boolean isExpired(long ttlMs) {
      return (System.currentTimeMillis() - timestamp) > ttlMs;
    }
  }

  public AiSuggestionService(
      SystemSettingRepository systemSettingRepository,
      AiUsageLogRepository aiUsageLogRepository,
      UserRepository userRepository,
      FamilyRepository familyRepository,
      WeightHistoryRepository weightHistoryRepository,
      WorkoutLogRepository workoutLogRepository,
      ScheduleActivityRepository scheduleActivityRepository,
      ObjectMapper objectMapper,
      @Value("${gelu.super-admin-email:luanvitors_852@hotmail.com}") String superAdminEmail) {
    this.systemSettingRepository = systemSettingRepository;
    this.aiUsageLogRepository = aiUsageLogRepository;
    this.userRepository = userRepository;
    this.familyRepository = familyRepository;
    this.weightHistoryRepository = weightHistoryRepository;
    this.workoutLogRepository = workoutLogRepository;
    this.scheduleActivityRepository = scheduleActivityRepository;
    this.objectMapper = objectMapper;
    this.superAdminEmail = superAdminEmail;
  }

  public MealSuggestionResponse generateSuggestion(UUID userId, GenerateSuggestionRequest request) {
    UUID familyId = null;
    boolean isSuperAdmin = false;

    // 1. Verificação de limites diários se o usuário estiver autenticado
    if (userId != null) {
      User user = userRepository.findById(userId).orElse(null);
      if (user != null) {
        if (superAdminEmail != null
            && user.getEmail().trim().equalsIgnoreCase(superAdminEmail.trim())) {
          isSuperAdmin = true;
        }

        List<Family> families = familyRepository.findAllByMemberUserId(userId);
        if (!families.isEmpty()) {
          familyId = families.get(0).getId();
        }

        // Validação de limites para usuários não-superadmin
        if (!isSuperAdmin) {
          LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
          if (familyId != null) {
            int limitPerFamily = getIntSetting("ai_daily_limit_per_family", 15);
            long usedToday = aiUsageLogRepository.countSinceByFamilyId(familyId, startOfDay);
            if (usedToday >= limitPerFamily) {
              throw new BadRequestException(
                  "Limite diário de sugestões de IA atingido para sua família ("
                      + limitPerFamily
                      + "/dia). O limite é renovado à meia-noite.");
            }
          } else {
            int limitPerUser = getIntSetting("ai_daily_limit_per_user", 10);
            long usedToday = aiUsageLogRepository.countSinceByUserId(userId, startOfDay);
            if (usedToday >= limitPerUser) {
              throw new BadRequestException(
                  "Limite diário de sugestões de IA atingido para sua conta ("
                      + limitPerUser
                      + "/dia). O limite é renovado à meia-noite.");
            }
          }
        }
      }
    }

    // 1.5. Verificação de Cache em Memória
    String suggestCacheKey =
        "SUGGEST:"
            + (request.mealType() != null ? request.mealType() : "")
            + ":"
            + (request.goal() != null ? request.goal() : "")
            + ":"
            + request.targetCalories()
            + ":"
            + (request.preferences() != null ? request.preferences().trim() : "");
    CachedAiItem cachedSuggest = aiCache.get(suggestCacheKey);
    if (cachedSuggest != null && !cachedSuggest.isExpired(12 * 3600 * 1000L)) {
      return (MealSuggestionResponse) cachedSuggest.value;
    }

    // 2. Tenta gerar via Google Gemini se a chave estiver configurada
    String apiKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    String model =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-2.5-flash");

    long startMs = System.currentTimeMillis();
    MealSuggestionResponse response = null;
    int promptTokens = 0;
    int completionTokens = 0;
    int totalTokens = 0;
    String status = "SUCCESS_LOCAL";

    if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("...")) {
      try {
        GeminiResult geminiRes = callGeminiApi(apiKey.trim(), model, request);
        if (geminiRes != null && geminiRes.suggestion != null) {
          response = geminiRes.suggestion;
          promptTokens = geminiRes.promptTokens;
          completionTokens = geminiRes.completionTokens;
          totalTokens = geminiRes.totalTokens;
          status = "SUCCESS_GEMINI";
        }
      } catch (Exception e) {
        // Fallback para gerador determinístico local caso a API oscile
        status = "FALLBACK_LOCAL";
      }
    }

    if (response == null) {
      response = generateLocalSuggestion(request);
      promptTokens = 120;
      completionTokens = 330;
      totalTokens = 450;
    }

    long latency = System.currentTimeMillis() - startMs;

    // 3. Registrar consumo de tokens
    try {
      AiUsageLog log =
          new AiUsageLog(
              userId,
              familyId,
              "MEAL_SUGGESTION",
              status.contains("GEMINI") ? model : "local-culinary-engine",
              promptTokens,
              completionTokens,
              totalTokens,
              latency,
              status);
      aiUsageLogRepository.save(log);
    } catch (Exception e) {
      // Log failure should not break user experience
    }

    if (response != null) {
      aiCache.put(suggestCacheKey, new CachedAiItem(response));
    }

    return response;
  }

  private int getIntSetting(String key, int defaultValue) {
    try {
      return systemSettingRepository
          .findByKey(key)
          .map(s -> Integer.parseInt(s.getValue().trim()))
          .orElse(defaultValue);
    } catch (Exception e) {
      return defaultValue;
    }
  }

  private GeminiResult callGeminiApi(String apiKey, String model, GenerateSuggestionRequest request)
      throws Exception {
    String endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/"
            + model
            + ":generateContent?key="
            + apiKey;

    String mealType = request.mealType() != null ? request.mealType() : "Almoço";
    String goal = request.goal() != null ? request.goal() : "Equilíbrio & Saúde";
    int targetCals =
        request.targetCalories() != null && request.targetCalories() > 0
            ? request.targetCalories()
            : 450;
    String preferences =
        request.preferences() != null ? request.preferences() : "Nenhuma restrição específica";

    String systemPrompt =
        "Você é o Chef e Nutricionista inteligente do sistema GeLu Menu. "
            + "Crie uma receita saudável e criativa típica brasileira ou balanceada. "
            + "Você DEVE responder ESTRITAMENTE em formato JSON com o seguinte schema:\n"
            + "{\n"
            + '"'
            + "title"
            + '"'
            + ": \"Nome do prato\",\n"
            + '"'
            + "mealType"
            + '"'
            + ": \""
            + mealType
            + "\",\n"
            + '"'
            + "calories"
            + '"'
            + ": "
            + targetCals
            + ",\n"
            + '"'
            + "prepTimeMinutes"
            + '"'
            + ": 25,\n"
            + '"'
            + "description"
            + '"'
            + ": \"Breve descrição do valor nutricional\",\n"
            + '"'
            + "ingredients"
            + '"'
            + ": [\"150g frango\", \"4 colheres arroz integral\"],\n"
            + '"'
            + "protein"
            + '"'
            + ": \"35g\",\n"
            + '"'
            + "carbs"
            + '"'
            + ": \"40g\",\n"
            + '"'
            + "fat"
            + '"'
            + ": \"10g\",\n"
            + '"'
            + "chefTip"
            + '"'
            + ": \"Dica do chef para realçar o sabor\"\n"
            + "}\n"
            + "Não inclua markdown (sem ```json), responda somente o JSON puro.";

    String userPrompt =
        "Tipo de refeição: "
            + mealType
            + ", Alvo calórico: "
            + targetCals
            + " kcal, Objetivo: "
            + goal
            + ", Preferências: "
            + preferences;

    String payload =
        "{"
            + "\"system_instruction\":{\"parts\":[{\"text\":\""
            + escapeJson(systemPrompt)
            + "\"}]},"
            + "\"contents\":[{\"role\":\"user\",\"parts\":[{\"text\":\""
            + escapeJson(userPrompt)
            + "\"}]}],"
            + "\"generationConfig\":{\"responseMimeType\":\"application/json\",\"temperature\":0.4}"
            + "}";

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    HttpRequest httpRequest =
        HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .timeout(Duration.ofSeconds(20))
            .build();

    HttpResponse<String> httpResponse =
        client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
    if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
      throw new RuntimeException("Gemini API error: " + httpResponse.statusCode());
    }

    JsonNode root = objectMapper.readTree(httpResponse.body());
    JsonNode textNode =
        root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
    if (textNode.isMissingNode()) {
      throw new RuntimeException("Missing text in Gemini response");
    }

    String rawText = textNode.asText().trim();
    if (rawText.startsWith("```json")) {
      rawText = rawText.substring(7);
    }
    if (rawText.startsWith("```")) {
      rawText = rawText.substring(3);
    }
    if (rawText.endsWith("```")) {
      rawText = rawText.substring(0, rawText.length() - 3);
    }
    rawText = rawText.trim();

    JsonNode parsed = objectMapper.readTree(rawText);
    String title = parsed.path("title").asText("Prato Saudável do Chef");
    int calories = parsed.path("calories").asInt(targetCals);
    int prepTime = parsed.path("prepTimeMinutes").asInt(25);
    String description = parsed.path("description").asText("");
    String protein = parsed.path("protein").asText("30g");
    String carbs = parsed.path("carbs").asText("40g");
    String fat = parsed.path("fat").asText("10g");
    String chefTip = parsed.path("chefTip").asText("");

    List<String> ingredients = new ArrayList<>();
    JsonNode ingNode = parsed.path("ingredients");
    if (ingNode.isArray()) {
      for (JsonNode item : ingNode) {
        ingredients.add(item.asText());
      }
    }
    if (ingredients.isEmpty()) {
      ingredients.add("Mix de ingredientes balanceados da estação");
    }

    MealSuggestionResponse suggestion =
        new MealSuggestionResponse(
            title,
            mealType,
            calories,
            prepTime,
            description,
            ingredients,
            protein,
            carbs,
            fat,
            chefTip);

    JsonNode usage = root.path("usageMetadata");
    int promptTokens = usage.path("promptTokenCount").asInt(150);
    int completionTokens = usage.path("candidatesTokenCount").asInt(350);
    int totalTokens = usage.path("totalTokenCount").asInt(500);

    return new GeminiResult(suggestion, promptTokens, completionTokens, totalTokens);
  }

  private String escapeJson(String s) {
    return s.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\b", "\\b")
        .replace("\f", "\\f")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }

  private MealSuggestionResponse generateLocalSuggestion(GenerateSuggestionRequest request) {
    String mealType =
        request.mealType() != null && !request.mealType().isBlank()
            ? request.mealType().trim()
            : "Almoço";
    int targetCals =
        request.targetCalories() != null && request.targetCalories() > 0
            ? request.targetCalories()
            : 450;

    if (mealType.toLowerCase().contains("café") || mealType.toLowerCase().contains("manhã")) {
      return new MealSuggestionResponse(
          "Bowl Proteico de Iogurte com Frutas Vermelhas e Granola Artesanal",
          "Café da Manhã",
          targetCals,
          10,
          "Opção leve com alta densidade nutricional, fibras e probióticos que mantém a saciedade matinal e energia estável.",
          List.of(
              "170g Iogurte natural desnatado ou grego",
              "1 colher de sopa de sementes de chia ou linhaça",
              "1 xícara de morangos e mirtilos frescos",
              "30g granola integral sem açúcar refinado",
              "1 fio de mel puro ou canela a gosto"),
          "24g",
          "38g",
          "8g",
          "Polvilhe uma pitada de canela em pó para acelerar a queima e realçar o aroma das frutas vermelhas.");
    }

    if (mealType.toLowerCase().contains("jantar") || mealType.toLowerCase().contains("noite")) {
      return new MealSuggestionResponse(
          "Filé de Tilápia Grelhada ao Limão Siciliano com Purê de Mandioquinha",
          "Jantar",
          targetCals,
          25,
          "Jantar digestivo de fácil assimilação com proteína magra e carboidrato de baixo índice glicêmico para promover um sono reparador.",
          List.of(
              "180g filé de tilápia fresca",
              "1 colher de sopa de azeite extravirgem",
              "Suco e raspas de 1/2 limão siciliano",
              "150g mandioquinha cozida e amassada com ervas finas",
              "Aspargos ou brócolis salteados no alho"),
          "36g",
          "28g",
          "11g",
          "Grelhe a tilápia em fogo médio-alto por apenas 3 minutos de cada lado para manter a suculência interna.");
    }

    if (mealType.toLowerCase().contains("lanche")) {
      return new MealSuggestionResponse(
          "Wrap Integral de Frango Desfiado com Creme de Ricota e Rúcula",
          "Lanche",
          targetCals,
          15,
          "Lanche prático e equilibrado, perfeito para recarregar as energias entre os estudos ou antes do treino.",
          List.of(
              "1 folha de wrap integral",
              "100g peito de frango cozido e desfiado temperado",
              "2 colheres de sopa de creme de ricota light",
              "Folhas de rúcula fresca e tomate cereja picado",
              "Orégano e gotas de azeite"),
          "28g",
          "24g",
          "7g",
          "Aqueça levemente o wrap na frigideira seca por 30 segundos antes de rechear para deixá-lo crocante.");
    }

    return new MealSuggestionResponse(
        "Peito de Frango Grelhado com Arroz Integral, Feijão Carioca e Salada Colorida",
        "Almoço",
        targetCals,
        30,
        "Combinação clássica e balanceada rica em aminoácidos essenciais, ferro e fibras para sustentação durante a rotina.",
        List.of(
            "160g filé de peito de frango marinado com ervas e páprica",
            "4 colheres de sopa de arroz integral cozido",
            "1 concha média de feijão carioca bem temperado",
            "Mix de folhas verdes (alface, rúcula e agrião)",
            "Cenoura ralada e tomate cereja com azeite"),
        "42g",
        "45g",
        "9g",
        "Deixe o frango marinando por 10 minutos em limão, alho e alecrim para um sabor artesanal incrível.");
  }

  private static class GeminiResult {
    final MealSuggestionResponse suggestion;
    final int promptTokens;
    final int completionTokens;
    final int totalTokens;

    GeminiResult(
        MealSuggestionResponse suggestion,
        int promptTokens,
        int completionTokens,
        int totalTokens) {
      this.suggestion = suggestion;
      this.promptTokens = promptTokens;
      this.completionTokens = completionTokens;
      this.totalTokens = totalTokens;
    }
  }

  public NutritionEstimateResponse estimateNutrition(
      UUID userId, NutritionEstimateRequest request) {
    int servings = (request.servings() != null && request.servings() > 0) ? request.servings() : 1;
    String name = request.name() != null ? request.name().trim() : "Receita";

    String nutriCacheKey =
        "NUTRI:"
            + name
            + ":"
            + servings
            + ":"
            + (request.ingredients() != null ? request.ingredients().size() : 0);
    CachedAiItem cachedNutri = aiCache.get(nutriCacheKey);
    if (cachedNutri != null && !cachedNutri.isExpired(24 * 3600 * 1000L)) {
      return (NutritionEstimateResponse) cachedNutri.value;
    }

    String apiKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    String model =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-2.5-flash");

    NutritionEstimateResponse response = null;

    if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("...")) {
      try {
        response = callGeminiNutritionApi(apiKey.trim(), model, request, servings);
      } catch (Exception e) {
        // Fallback para gerador heurístico local
      }
    }

    if (response == null) {
      response = calculateLocalNutrition(request, servings);
    }

    if (response != null) {
      aiCache.put(nutriCacheKey, new CachedAiItem(response));
    }

    return response;
  }

  private NutritionEstimateResponse callGeminiNutritionApi(
      String apiKey, String model, NutritionEstimateRequest request, int servings)
      throws Exception {
    String endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/"
            + model
            + ":generateContent?key="
            + apiKey;

    StringBuilder ingredientsList = new StringBuilder();
    if (request.ingredients() != null) {
      for (NutritionIngredientItem ing : request.ingredients()) {
        ingredientsList
            .append("- ")
            .append(ing.quantity() != null ? ing.quantity() : "")
            .append(" ")
            .append(ing.unit() != null ? ing.unit() : "")
            .append(" ")
            .append(ing.name() != null ? ing.name() : "")
            .append("\n");
      }
    }

    String prompt =
        "Você é um nutricionista especialista. Estime os valores nutricionais TOTAIS da receita inteira:\n"
            + "Nome: "
            + request.name()
            + "\n"
            + "Categoria: "
            + (request.category() != null ? request.category() : "Geral")
            + "\n"
            + "Porções: "
            + servings
            + "\n"
            + "Ingredientes:\n"
            + ingredientsList.toString()
            + "\n"
            + "Responda ESTRITAMENTE em formato JSON com este schema exato:\n"
            + "{\n"
            + "  \"totalCalories\": 350.0,\n"
            + "  \"carbohydrates\": 40.0,\n"
            + "  \"proteins\": 20.0,\n"
            + "  \"fats\": 10.0,\n"
            + "  \"fibers\": 5.0,\n"
            + "  \"sodium\": 300.0\n"
            + "}";

    String requestBody =
        "{\"contents\":[{\"parts\":[{\"text\":\""
            + prompt.replace("\"", "\\\"").replace("\n", "\\n")
            + "\"}]}],\"generationConfig\":{\"responseMimeType\":\"application/json\",\"temperature\":0.2}}";

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    HttpRequest httpReq =
        HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(20))
            .build();

    HttpResponse<String> httpRes = client.send(httpReq, HttpResponse.BodyHandlers.ofString());
    if (httpRes.statusCode() >= 200 && httpRes.statusCode() < 300) {
      JsonNode root = objectMapper.readTree(httpRes.body());
      JsonNode candidates = root.path("candidates");
      if (candidates.isArray() && !candidates.isEmpty()) {
        String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        int jsonStart = text.indexOf('{');
        int jsonEnd = text.lastIndexOf('}');
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          JsonNode json = objectMapper.readTree(text.substring(jsonStart, jsonEnd + 1));
          BigDecimal totalCals =
              BigDecimal.valueOf(json.path("totalCalories").asDouble(350.0))
                  .setScale(1, RoundingMode.HALF_UP);
          BigDecimal carbs =
              BigDecimal.valueOf(json.path("carbohydrates").asDouble(40.0))
                  .setScale(1, RoundingMode.HALF_UP);
          BigDecimal protein =
              BigDecimal.valueOf(json.path("proteins").asDouble(20.0))
                  .setScale(1, RoundingMode.HALF_UP);
          BigDecimal fats =
              BigDecimal.valueOf(json.path("fats").asDouble(10.0))
                  .setScale(1, RoundingMode.HALF_UP);
          BigDecimal fibers =
              BigDecimal.valueOf(json.path("fibers").asDouble(4.0))
                  .setScale(1, RoundingMode.HALF_UP);
          BigDecimal sodium =
              BigDecimal.valueOf(json.path("sodium").asDouble(250.0))
                  .setScale(1, RoundingMode.HALF_UP);

          BigDecimal s = BigDecimal.valueOf(servings);
          return new NutritionEstimateResponse(
              totalCals,
              carbs,
              protein,
              fats,
              fibers,
              sodium,
              servings,
              totalCals.divide(s, 1, RoundingMode.HALF_UP),
              carbs.divide(s, 1, RoundingMode.HALF_UP),
              protein.divide(s, 1, RoundingMode.HALF_UP),
              fats.divide(s, 1, RoundingMode.HALF_UP),
              fibers.divide(s, 1, RoundingMode.HALF_UP),
              sodium.divide(s, 1, RoundingMode.HALF_UP),
              "GEMINI_AI");
        }
      }
    }
    return null;
  }

  private NutritionEstimateResponse calculateLocalNutrition(
      NutritionEstimateRequest request, int servings) {
    double totalCals = 0;
    double carbs = 0;
    double protein = 0;
    double fats = 0;
    double fibers = 0;
    double sodium = 0;

    if (request.ingredients() != null && !request.ingredients().isEmpty()) {
      for (NutritionIngredientItem ing : request.ingredients()) {
        String name = ing.name() != null ? ing.name().toLowerCase() : "";
        double qty = 1.0;
        try {
          if (ing.quantity() != null && !ing.quantity().isBlank()) {
            qty = Double.parseDouble(ing.quantity().replace(",", ".").replaceAll("[^0-9.]", ""));
          }
        } catch (Exception ignored) {
        }

        if (name.contains("ovo")) {
          totalCals += 75 * qty;
          protein += 6.5 * qty;
          fats += 5.0 * qty;
          carbs += 0.5 * qty;
          sodium += 70 * qty;
        } else if (name.contains("frango")
            || name.contains("peito")
            || name.contains("patinho")
            || name.contains("carne")) {
          double factor = qty > 20 ? (qty / 100.0) : 1.5;
          totalCals += 165 * factor;
          protein += 31 * factor;
          fats += 4.5 * factor;
          sodium += 75 * factor;
        } else if (name.contains("arroz")
            || name.contains("penne")
            || name.contains("massa")
            || name.contains("batata")) {
          double factor = qty > 20 ? (qty / 100.0) : 1.2;
          totalCals += 130 * factor;
          carbs += 28 * factor;
          protein += 3 * factor;
          fibers += 2 * factor;
        } else if (name.contains("aveia")
            || name.contains("granola")
            || name.contains("pão")
            || name.contains("torrada")) {
          double factor = qty > 10 ? (qty / 50.0) : (qty * 0.5);
          totalCals += 120 * factor;
          carbs += 22 * factor;
          protein += 4.5 * factor;
          fibers += 3.5 * factor;
          fats += 2.0 * factor;
        } else if (name.contains("banana") || name.contains("fruta") || name.contains("maçã")) {
          totalCals += 95 * qty;
          carbs += 24 * qty;
          protein += 1.2 * qty;
          fibers += 3.0 * qty;
        } else if (name.contains("queijo")
            || name.contains("ricota")
            || name.contains("manteiga")
            || name.contains("azeite")
            || name.contains("amendoim")) {
          double factor = qty > 10 ? (qty / 30.0) : 1.0;
          totalCals += 100 * factor;
          fats += 8.0 * factor;
          protein += 4.0 * factor;
          sodium += 120 * factor;
        } else if (name.contains("iogurte")) {
          totalCals += 100 * qty;
          protein += 7.0 * qty;
          carbs += 9.0 * qty;
          fats += 3.0 * qty;
        } else if (name.contains("brócolis")
            || name.contains("espinafre")
            || name.contains("cenoura")
            || name.contains("tomate")
            || name.contains("alface")) {
          totalCals += 30 * qty;
          carbs += 5.0 * qty;
          protein += 2.0 * qty;
          fibers += 2.5 * qty;
        } else {
          totalCals += 40 * qty;
          carbs += 6 * qty;
          protein += 1.5 * qty;
          fats += 1 * qty;
        }
      }
    }

    if (totalCals < 50) {
      // Default razoável por porção
      totalCals = 320.0 * servings;
      carbs = 38.0 * servings;
      protein = 18.0 * servings;
      fats = 9.0 * servings;
      fibers = 4.0 * servings;
      sodium = 280.0 * servings;
    }

    BigDecimal totalCaloriesBd = BigDecimal.valueOf(totalCals).setScale(1, RoundingMode.HALF_UP);
    BigDecimal carbsBd = BigDecimal.valueOf(carbs).setScale(1, RoundingMode.HALF_UP);
    BigDecimal proteinBd = BigDecimal.valueOf(protein).setScale(1, RoundingMode.HALF_UP);
    BigDecimal fatsBd = BigDecimal.valueOf(fats).setScale(1, RoundingMode.HALF_UP);
    BigDecimal fibersBd = BigDecimal.valueOf(fibers).setScale(1, RoundingMode.HALF_UP);
    BigDecimal sodiumBd = BigDecimal.valueOf(sodium).setScale(1, RoundingMode.HALF_UP);

    BigDecimal s = BigDecimal.valueOf(servings);
    return new NutritionEstimateResponse(
        totalCaloriesBd,
        carbsBd,
        proteinBd,
        fatsBd,
        fibersBd,
        sodiumBd,
        servings,
        totalCaloriesBd.divide(s, 1, RoundingMode.HALF_UP),
        carbsBd.divide(s, 1, RoundingMode.HALF_UP),
        proteinBd.divide(s, 1, RoundingMode.HALF_UP),
        fatsBd.divide(s, 1, RoundingMode.HALF_UP),
        fibersBd.divide(s, 1, RoundingMode.HALF_UP),
        sodiumBd.divide(s, 1, RoundingMode.HALF_UP),
        "LOCAL_ENGINE");
  }

  public WorkoutCalorieEstimateResponse estimateWorkoutCalories(
      UUID userId, WorkoutCalorieEstimateRequest request) {
    int duration =
        (request.durationMinutes() != null && request.durationMinutes() > 0)
            ? request.durationMinutes()
            : 45;
    String activity =
        (request.activity() != null && !request.activity().isBlank())
            ? request.activity().trim()
            : "Treino / Atividade Física";
    String intensity =
        (request.intensity() != null && !request.intensity().isBlank())
            ? request.intensity().trim().toUpperCase()
            : "MODERADO";

    double weightKg = 75.0;
    if (request.userWeightKg() != null && request.userWeightKg().doubleValue() >= 30.0) {
      weightKg = request.userWeightKg().doubleValue();
    } else if (userId != null) {
      var userOpt = userRepository.findById(userId);
      if (userOpt.isPresent()
          && userOpt.get().getCurrentWeight() != null
          && userOpt.get().getCurrentWeight().doubleValue() >= 30.0) {
        weightKg = userOpt.get().getCurrentWeight().doubleValue();
      }
    }

    String workoutCacheKey =
        "WORKOUT:"
            + activity.toLowerCase()
            + ":"
            + duration
            + ":"
            + intensity.toLowerCase()
            + ":"
            + (int) weightKg;
    CachedAiItem cachedWorkout = aiCache.get(workoutCacheKey);
    if (cachedWorkout != null && !cachedWorkout.isExpired(24 * 3600 * 1000L)) {
      return (WorkoutCalorieEstimateResponse) cachedWorkout.value;
    }

    String apiKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    String model =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-2.5-flash");

    WorkoutCalorieEstimateResponse response = null;
    if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("...")) {
      try {
        response =
            callGeminiWorkoutApi(apiKey.trim(), model, activity, duration, intensity, weightKg);
      } catch (Exception ignored) {
      }
    }

    if (response == null) {
      response = calculateLocalWorkoutCalories(activity, duration, intensity, weightKg);
    }

    if (response != null) {
      aiCache.put(workoutCacheKey, new CachedAiItem(response));
    }

    return response;
  }

  private WorkoutCalorieEstimateResponse callGeminiWorkoutApi(
      String apiKey, String model, String activity, int duration, String intensity, double weightKg)
      throws Exception {
    String endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/"
            + model
            + ":generateContent?key="
            + apiKey;

    String prompt =
        "Você é um fisiologista do exercício físico e educador físico especialista.\n"
            + "Estime o gasto calórico exato para a seguinte atividade:\n"
            + "Atividade: "
            + activity
            + "\n"
            + "Duração: "
            + duration
            + " minutos\n"
            + "Intensidade: "
            + intensity
            + "\n"
            + "Peso corporal do praticante: "
            + weightKg
            + " kg\n\n"
            + "Responda ESTRITAMENTE em formato JSON com o seguinte schema exato:\n"
            + "{\n"
            + "  \"estimatedCalories\": 350,\n"
            + "  \"caloriesPerHour\": 460,\n"
            + "  \"met\": 7.0,\n"
            + "  \"explanation\": \"Explicação breve de 1 frase.\"\n"
            + "}";

    String requestBody =
        "{\"contents\":[{\"parts\":[{\"text\":\""
            + prompt.replace("\"", "\\\"").replace("\n", "\\n")
            + "\"}]}],\"generationConfig\":{\"responseMimeType\":\"application/json\",\"temperature\":0.2}}";

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    HttpRequest httpReq =
        HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(20))
            .build();

    HttpResponse<String> httpRes = client.send(httpReq, HttpResponse.BodyHandlers.ofString());
    if (httpRes.statusCode() < 200 || httpRes.statusCode() >= 300) {
      throw new RuntimeException("Falha na chamada Gemini API");
    }

    JsonNode root = objectMapper.readTree(httpRes.body());
    JsonNode textNode =
        root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
    String text = textNode.asText();

    String cleanJson = text;
    int firstBrace = text.indexOf('{');
    int lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleanJson = text.substring(firstBrace, lastBrace + 1);
    }

    JsonNode data = objectMapper.readTree(cleanJson);
    int estCals =
        data.path("estimatedCalories").asInt((int) Math.round(5.5 * weightKg * (duration / 60.0)));
    int calsPerHour =
        data.path("caloriesPerHour").asInt((int) Math.round((estCals * 60.0) / duration));
    double met = data.path("met").asDouble(5.5);
    String explanation =
        data.path("explanation").asText("Estimativa calculada via IA para " + activity);

    return new WorkoutCalorieEstimateResponse(
        activity, duration, estCals, calsPerHour, met, weightKg, intensity, explanation, "GEMINI");
  }

  private WorkoutCalorieEstimateResponse calculateLocalWorkoutCalories(
      String activity, int duration, String intensity, double weightKg) {
    String lower = activity.toLowerCase();
    double baseMet = 5.5;

    if (lower.contains("corrida")
        || lower.contains("correr")
        || lower.contains("jogging")
        || lower.contains("esteira")) {
      baseMet = 9.0;
    } else if (lower.contains("bike")
        || lower.contains("ciclismo")
        || lower.contains("bicicleta")
        || lower.contains("spinning")
        || lower.contains("pedalar")) {
      baseMet = 7.5;
    } else if (lower.contains("muscul")
        || lower.contains("força")
        || lower.contains("hipertrofia")
        || lower.contains("peso")
        || lower.contains("calistenia")) {
      baseMet = 5.5;
    } else if (lower.contains("caminha") || lower.contains("passeio") || lower.contains("passo")) {
      baseMet = 3.8;
    } else if (lower.contains("funcional")
        || lower.contains("hiit")
        || lower.contains("crossfit")
        || lower.contains("circuito")) {
      baseMet = 8.0;
    } else if (lower.contains("nata") || lower.contains("nado") || lower.contains("piscina")) {
      baseMet = 7.0;
    } else if (lower.contains("futebol")
        || lower.contains("futsal")
        || lower.contains("basquete")
        || lower.contains("volei")
        || lower.contains("vôlei")) {
      baseMet = 8.0;
    } else if (lower.contains("luta")
        || lower.contains("boxe")
        || lower.contains("jiu")
        || lower.contains("muay")
        || lower.contains("artes marciais")) {
      baseMet = 8.5;
    } else if (lower.contains("yoga")
        || lower.contains("ioga")
        || lower.contains("alongamento")
        || lower.contains("pilates")) {
      baseMet = 3.0;
    } else if (lower.contains("dança")
        || lower.contains("danca")
        || lower.contains("zumba")
        || lower.contains("ritmo")) {
      baseMet = 6.0;
    } else if (lower.contains("tennis")
        || lower.contains("tênis")
        || lower.contains("beach tennis")
        || lower.contains("squash")) {
      baseMet = 7.0;
    }

    double multiplier = 1.0;
    if ("LEVE".equals(intensity) || "BAIXA".equals(intensity)) {
      multiplier = 0.85;
    } else if ("INTENSO".equals(intensity) || "ALTA".equals(intensity)) {
      multiplier = 1.25;
    } else if ("MUITO_INTENSO".equals(intensity) || "MAXIMA".equals(intensity)) {
      multiplier = 1.45;
    }

    double finalMet = Math.round(baseMet * multiplier * 10.0) / 10.0;
    int caloriesPerHour = (int) Math.round(finalMet * weightKg);
    int estimatedCalories = (int) Math.round((caloriesPerHour * duration) / 60.0);

    String explanation =
        String.format(
            "Cálculo estimado para %s (Intensidade %s) com base no índice fisiológico de %.1f METs para peso corporal de %.1f kg.",
            activity, intensity.toLowerCase(), finalMet, weightKg);

    return new WorkoutCalorieEstimateResponse(
        activity,
        duration,
        estimatedCalories,
        caloriesPerHour,
        finalMet,
        weightKg,
        intensity,
        explanation,
        "LOCAL_ENGINE");
  }

  public WeeklyEvolutionSummaryResponse generateWeeklyEvolutionSummary(
      UUID userId, WeeklySummaryRequest request) {
    LocalDate today = LocalDate.now();
    LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
    LocalDate sunday = monday.plusDays(6);

    String periodLabel =
        String.format(
            "%02d/%02d a %02d/%02d",
            monday.getDayOfMonth(),
            monday.getMonthValue(),
            sunday.getDayOfMonth(),
            sunday.getMonthValue());

    Instant weekStart = monday.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant weekEnd = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

    // 1. Obter treinos da semana
    List<WorkoutLog> workouts;
    if (request != null && request.familyId() != null) {
      workouts =
          workoutLogRepository.findAllRecent(userId, request.familyId()).stream()
              .filter(w -> w.getPerformedAt() != null && !w.getPerformedAt().isBefore(weekStart))
              .toList();
    } else {
      workouts = workoutLogRepository.findAllByUserAndDateRange(userId, weekStart, weekEnd);
    }

    int workoutsCount = workouts.size();
    int totalMinutes = workouts.stream().mapToInt(WorkoutLog::getDurationMinutes).sum();
    int caloriesBurned = workouts.stream().mapToInt(WorkoutLog::getCaloriesBurned).sum();

    // 2. Obter atividades da agenda
    List<ScheduleActivity> activities;
    if (request != null && request.familyId() != null) {
      activities = scheduleActivityRepository.findAllByFamilyId(request.familyId());
    } else {
      activities = scheduleActivityRepository.findAllByUserIdAndFamilyIsNull(userId);
    }
    int activitiesCompleted = activities.size();

    // 3. Obter histórico de peso recente
    List<WeightHistory> weightRecords =
        weightHistoryRepository.findByUserIdOrderByRecordedAtDesc(userId);
    BigDecimal currentWeight = null;
    BigDecimal weightChange = BigDecimal.ZERO;
    String weightProgressNote = "Sem registro recente de peso.";

    if (!weightRecords.isEmpty()) {
      currentWeight = weightRecords.get(0).getWeightKg();
      if (weightRecords.size() > 1) {
        BigDecimal prev = weightRecords.get(1).getWeightKg();
        weightChange = currentWeight.subtract(prev);
        if (weightChange.compareTo(BigDecimal.ZERO) < 0) {
          weightProgressNote =
              String.format(
                  "Evolução positiva: redução de %s kg em relação ao registro anterior.",
                  weightChange.abs().toPlainString());
        } else if (weightChange.compareTo(BigDecimal.ZERO) > 0) {
          weightProgressNote =
              String.format(
                  "Aumento de %s kg registrado. Acompanhe a composição corporal e treinos.",
                  weightChange.toPlainString());
        } else {
          weightProgressNote = "Peso estável e mantido em relação ao último registro.";
        }
      } else {
        weightProgressNote =
            String.format("Peso atual registrado em %s kg.", currentWeight.toPlainString());
      }
    }

    // 4. Analisar diagnósticos
    List<String> wentWell = new ArrayList<>();
    List<String> missedOrAttention = new ArrayList<>();
    List<String> recommendations = new ArrayList<>();

    if (workoutsCount >= 3) {
      wentWell.add(
          String.format(
              "Excelente consistência esportiva: %d treinos realizados com %d kcal queimadas no total.",
              workoutsCount, caloriesBurned));
    } else if (workoutsCount > 0) {
      wentWell.add(
          String.format(
              "Movimentou o corpo nesta semana: %d treino(s) totalizando %d minutos de atividade física.",
              workoutsCount, totalMinutes));
    }

    if (activitiesCompleted > 0) {
      wentWell.add(
          String.format(
              "%d tarefas e hábitos essenciais da casa/agenda foram cumpridos com sucesso.",
              activitiesCompleted));
    }

    if (weightChange.compareTo(BigDecimal.ZERO) < 0) {
      wentWell.add(
          String.format(
              "Progresso na balança: variação favorável de -%s kg nesta semana.",
              weightChange.abs().toPlainString()));
    }

    if (wentWell.isEmpty()) {
      wentWell.add("Semana de início e organização da rotina e hábitos da casa.");
    }

    // Pontos de Atenção / O que faltou
    if (workoutsCount < 2) {
      missedOrAttention.add(
          "Volume de treinos abaixo da meta ideal recomendada (mínimo de 3 sessões semanais).");
    }

    // Verificar se pesou esta semana (desde segunda)
    boolean weighedThisWeek =
        weightRecords.stream()
            .anyMatch(
                w ->
                    w.getRecordedAt() != null
                        && !w.getRecordedAt().isBefore(monday.atStartOfDay()));
    if (!weighedThisWeek) {
      missedOrAttention.add(
          "Pesagem semanal ainda pendente! A segunda-feira é o melhor momento para atualizar a balança.");
    }

    if (missedOrAttention.isEmpty()) {
      missedOrAttention.add(
          "Sem desvios críticos detectados — mantenha o ritmo na hidratação e sono regular.");
    }

    // Recomendações / O que pode melhorar
    recommendations.add(
        "Definir o horário de pesagem oficial nas manhãs de segunda-feira para manter o histórico contínuo.");
    if (workoutsCount < 3) {
      recommendations.add(
          "Agendar com antecedência na agenda os 3 dias fixos de treino para proteger esse horário.");
    } else {
      recommendations.add(
          "Manter a alternância inteligente de treinos de força e aeróbicos para otimizar a queima calórica.");
    }
    recommendations.add(
        "Aproveitar a visualização em lista das receitas para planejar refeições equilibradas da semana com boa proteína.");

    String overallStatus =
        workoutsCount >= 3 && missedOrAttention.size() <= 1
            ? "POSITIVO"
            : (workoutsCount >= 1 ? "MODERADO" : "ATENCAO");
    String headline =
        "POSITIVO".equals(overallStatus)
            ? "Semana de alta consistência e dedicação na rotina saudável!"
            : ("MODERADO".equals(overallStatus)
                ? "Bom ritmo mantido, com pequenos ajustes de constância pela frente."
                : "Momento oportuno para retomar o ritmo e organizar a semana que vem.");

    // 5. Escopo da Família & Lar (Pontos Coletivos da Casa)
    String famName = "Nossa Casa";
    List<String> famWentWell = new ArrayList<>();
    List<String> famMissed = new ArrayList<>();
    List<String> famRecs = new ArrayList<>();

    if (request != null && request.familyId() != null) {
      Family family = familyRepository.findByIdWithMembers(request.familyId()).orElse(null);
      if (family != null) {
        famName = family.getName();
      }
    }

    if (activitiesCompleted > 0) {
      famWentWell.add(
          String.format(
              "%d tarefas, hábitos e acordos da casa mantidos em dia no nosso espaço.",
              activitiesCompleted));
    } else {
      famWentWell.add("Espaço e rotina da casa organizados.");
    }
    famWentWell.add("Cardápio e receitas saudáveis alinhados para as refeições da semana.");

    if (activitiesCompleted < 5) {
      famMissed.add("Poucas tarefas ou hábitos registrados na rotina da casa nesta semana.");
    } else {
      famMissed.add("Atenção para manter os acordos de convivência e despensa sempre atualizados.");
    }

    famRecs.add(
        "Reservar ao menos uma refeição afetiva juntos na semana para celebrar o progresso da casa.");
    famRecs.add("Alinhar as tarefas e o cardápio da semana logo no domingo ou segunda-feira.");

    FamilyScopeSummary familyScope =
        new FamilyScopeSummary(famName, activitiesCompleted, famWentWell, famMissed, famRecs);

    // 6. Detalhamento Individual por Membro (Separando o que é de quem!)
    List<MemberWeeklySummary> memberBreakdown = new ArrayList<>();

    if (request != null && request.familyId() != null) {
      Family family = familyRepository.findByIdWithMembers(request.familyId()).orElse(null);
      if (family != null) {
        for (var m : family.getMembers()) {
          User u = m.getUser();
          var mWorkouts =
              workoutLogRepository.findAllByUserAndDateRange(u.getId(), weekStart, weekEnd);
          int mCount = mWorkouts.size();
          int mMin = mWorkouts.stream().mapToInt(WorkoutLog::getDurationMinutes).sum();
          int mCal = mWorkouts.stream().mapToInt(WorkoutLog::getCaloriesBurned).sum();

          var mWeights = weightHistoryRepository.findByUserIdOrderByRecordedAtDesc(u.getId());
          BigDecimal mCurrentW = null;
          BigDecimal mDelta = BigDecimal.ZERO;
          boolean mWeighed = false;

          if (!mWeights.isEmpty()) {
            mCurrentW = mWeights.get(0).getWeightKg();
            mWeighed =
                mWeights.stream()
                    .anyMatch(
                        w ->
                            w.getRecordedAt() != null
                                && !w.getRecordedAt().isBefore(monday.atStartOfDay()));
            if (mWeights.size() > 1) {
              mDelta = mCurrentW.subtract(mWeights.get(1).getWeightKg());
            }
          }

          List<String> mWentWell = new ArrayList<>();
          List<String> mMissed = new ArrayList<>();
          List<String> mRecs = new ArrayList<>();

          if (mCount >= 3) {
            mWentWell.add(
                String.format(
                    "Alta dedicação esportiva: %d treinos com %d kcal queimadas no total.",
                    mCount, mCal));
          } else if (mCount > 0) {
            mWentWell.add(
                String.format(
                    "Manteve o corpo em movimento: %d treino(s) totalizando %d minutos de exercício.",
                    mCount, mMin));
          }

          if (mDelta.compareTo(BigDecimal.ZERO) < 0) {
            mWentWell.add(
                String.format(
                    "Progresso na balança: variação favorável de -%s kg registrada.",
                    mDelta.abs().toPlainString()));
          } else if (mCurrentW != null && mWeights.size() == 1) {
            mWentWell.add(
                String.format(
                    "Primeiro peso de referência cadastrado: %s kg.", mCurrentW.toPlainString()));
          }

          if (mWentWell.isEmpty()) {
            mWentWell.add("Semana de início na jornada de hábitos saudáveis.");
          }

          if (mCount < 3) {
            mMissed.add(
                String.format(
                    "Volume de treinos abaixo da meta ideal (%d de 3 sessões realizadas).",
                    mCount));
          }
          if (!mWeighed) {
            mMissed.add("Ainda não registrou a pesagem oficial desta semana na balança.");
          }

          mRecs.add(
              "Realizar pesagem oficial na manhã de segunda-feira para manter o histórico contínuo.");
          if (mCount < 3) {
            mRecs.add(
                "Bloquear na agenda os horários específicos de treino para a próxima semana.");
          } else {
            mRecs.add("Manter a intensidade e alternância de grupos musculares.");
          }

          memberBreakdown.add(
              new MemberWeeklySummary(
                  u.getId().toString(),
                  u.getName(),
                  m.getRole().name(),
                  mCount,
                  mMin,
                  mCal,
                  mCurrentW,
                  mDelta,
                  mWentWell,
                  mMissed,
                  mRecs));
        }
      }
    }

    if (memberBreakdown.isEmpty()) {
      User u = userRepository.findById(userId).orElse(null);
      String name = u != null ? u.getName() : "Você";
      List<String> mWentWell = new ArrayList<>(wentWell);
      List<String> mMissed = new ArrayList<>(missedOrAttention);
      List<String> mRecs = new ArrayList<>(recommendations);

      memberBreakdown.add(
          new MemberWeeklySummary(
              userId.toString(),
              name,
              "TITULAR",
              workoutsCount,
              totalMinutes,
              caloriesBurned,
              currentWeight,
              weightChange,
              mWentWell,
              mMissed,
              mRecs));
    }

    return new WeeklyEvolutionSummaryResponse(
        periodLabel,
        headline,
        overallStatus,
        weightProgressNote,
        wentWell,
        missedOrAttention,
        recommendations,
        workoutsCount,
        totalMinutes,
        caloriesBurned,
        activitiesCompleted,
        currentWeight,
        weightChange,
        familyScope,
        memberBreakdown);
  }
}
