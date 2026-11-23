package br.com.gelu.menu.meals;

import br.com.gelu.menu.admin.AiUsageLog;
import br.com.gelu.menu.admin.AiUsageLogRepository;
import br.com.gelu.menu.admin.SystemSetting;
import br.com.gelu.menu.admin.SystemSettingRepository;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.meals.dto.AnalyzeMealPhotoResponse;
import br.com.gelu.menu.meals.dto.CreateMealLogRequest;
import br.com.gelu.menu.meals.dto.DailyMealSummaryResponse;
import br.com.gelu.menu.meals.dto.MealLogResponse;
import br.com.gelu.menu.media.ObjectStorageService;
import br.com.gelu.menu.users.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MealLogService {

  private static final Set<String> ALLOWED_IMAGE_TYPES =
      Set.of("image/jpeg", "image/png", "image/webp");
  private static final long MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB

  private final MealLogRepository mealLogRepository;
  private final ObjectStorageService objectStorageService;
  private final SystemSettingRepository systemSettingRepository;
  private final AiUsageLogRepository aiUsageLogRepository;
  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final ObjectMapper objectMapper;
  private final String superAdminEmail;

  public MealLogService(
      MealLogRepository mealLogRepository,
      ObjectStorageService objectStorageService,
      SystemSettingRepository systemSettingRepository,
      AiUsageLogRepository aiUsageLogRepository,
      UserRepository userRepository,
      FamilyRepository familyRepository,
      ObjectMapper objectMapper,
      @Value("${gelu.super-admin-email:luanvitors_852@hotmail.com}") String superAdminEmail) {
    this.mealLogRepository = mealLogRepository;
    this.objectStorageService = objectStorageService;
    this.systemSettingRepository = systemSettingRepository;
    this.aiUsageLogRepository = aiUsageLogRepository;
    this.userRepository = userRepository;
    this.familyRepository = familyRepository;
    this.objectMapper = objectMapper;
    this.superAdminEmail = superAdminEmail;
  }

  public AnalyzeMealPhotoResponse analyzeMealPhoto(
      UUID userId, MultipartFile file, String mealTypeHint, String notesHint) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Foto da refeição é obrigatória");
    }

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
      throw new BadRequestException(
          "Formato de imagem inválido. Formatos suportados: JPG, PNG, WEBP");
    }

    if (file.getSize() > MAX_PHOTO_SIZE) {
      throw new BadRequestException("A foto não pode ultrapassar 10 MB");
    }

    // 1. Upload seguro da foto no MinIO
    String ext = "jpg";
    if (contentType.contains("png")) ext = "png";
    else if (contentType.contains("webp")) ext = "webp";

    String objectKey = "meal-photos/" + UUID.randomUUID() + "." + ext;
    try (InputStream is = file.getInputStream()) {
      objectStorageService.put(objectKey, is, file.getSize(), contentType);
    } catch (Exception e) {
      throw new BadRequestException("Erro ao armazenar imagem da refeição");
    }

    String photoUrl = "/api/v1/meals/photo/" + objectKey.replace("meal-photos/", "");

    // 2. Análise Multimodal com FoodVisionAgent (Gemini 2.5 Flash ou Fallback Local)
    String apiKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    String model =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-2.5-flash");

    long startMs = System.currentTimeMillis();
    AnalyzeMealPhotoResponse analysis = null;
    int promptTokens = 0;
    int completionTokens = 0;
    int totalTokens = 0;
    String status = "SUCCESS_LOCAL";

    if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("...")) {
      try {
        byte[] imageBytes = file.getBytes();
        GeminiVisionResult result =
            callGeminiVisionApi(
                apiKey.trim(), model, imageBytes, contentType, mealTypeHint, notesHint, photoUrl);
        if (result != null && result.response != null) {
          analysis = result.response;
          promptTokens = result.promptTokens;
          completionTokens = result.completionTokens;
          totalTokens = result.totalTokens;
          status = "SUCCESS_GEMINI";
        }
      } catch (Exception e) {
        status = "FALLBACK_LOCAL";
      }
    }

    if (analysis == null) {
      analysis = fallbackLocalFoodVision(mealTypeHint, notesHint, photoUrl);
      promptTokens = 150;
      completionTokens = 250;
      totalTokens = 400;
    }

    long latency = System.currentTimeMillis() - startMs;

    // 3. Telemetria e auditoria de IA
    try {
      UUID familyId = null;
      if (userId != null) {
        List<Family> families = familyRepository.findAllByMemberUserId(userId);
        if (!families.isEmpty()) familyId = families.get(0).getId();
      }
      AiUsageLog log =
          new AiUsageLog(
              userId,
              familyId,
              "FOOD_VISION_ANALYSIS",
              status.contains("GEMINI") ? model : "local-food-heuristic",
              promptTokens,
              completionTokens,
              totalTokens,
              latency,
              status);
      aiUsageLogRepository.save(log);
    } catch (Exception ignored) {
    }

    return analysis;
  }

  private GeminiVisionResult callGeminiVisionApi(
      String apiKey,
      String model,
      byte[] imageBytes,
      String mimeType,
      String mealTypeHint,
      String notesHint,
      String photoUrl)
      throws Exception {
    String endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/"
            + model
            + ":generateContent?key="
            + apiKey;

    String base64Image = Base64.getEncoder().encodeToString(imageBytes);
    String hintMeal = mealTypeHint != null && !mealTypeHint.isBlank() ? mealTypeHint : "Refeição";
    String hintNotes =
        notesHint != null && !notesHint.isBlank()
            ? notesHint
            : "Nenhuma informação adicional fornecida.";

    String systemInstruction =
        "Você é o FoodVisionAgent especialista em nutrição clínica, gastronomia brasileira e análise visual de alimentos do GeLu Menu. "
            + "Analise a foto do prato fornecida, identifique cada alimento visível, estime as porções com precisão e calcule os macronutrientes totais. "
            + "Responda ESTRITAMENTE em formato JSON com o seguinte schema:\n"
            + "{\n"
            + "  \"dishName\": \"Nome principal do prato/refeição\",\n"
            + "  \"confidence\": \"HIGH\",\n"
            + "  \"totalCalories\": 450.0,\n"
            + "  \"proteins\": 35.0,\n"
            + "  \"carbohydrates\": 45.0,\n"
            + "  \"fats\": 12.0,\n"
            + "  \"fibers\": 6.0,\n"
            + "  \"sodium\": 380.0,\n"
            + "  \"items\": [\n"
            + "    {\n"
            + "      \"name\": \"Alimento identificado\",\n"
            + "      \"portion\": \"150g (1 filé médio)\",\n"
            + "      \"calories\": 240.0,\n"
            + "      \"proteins\": 30.0,\n"
            + "      \"carbohydrates\": 0.0,\n"
            + "      \"fats\": 4.5\n"
            + "    }\n"
            + "  ],\n"
            + "  \"nutritionNotes\": \"Breve diagnóstico ou dica nutricional sobre o prato\"\n"
            + "}";

    String userPrompt =
        "Analise esta foto de refeição. Contexto do usuário - Tipo de refeição: "
            + hintMeal
            + ", Observações: "
            + hintNotes;

    // Montagem do JSON com system_instruction, inlineData e responseMimeType
    String requestBody =
        "{"
            + "\"system_instruction\":{\"parts\":[{\"text\":\""
            + escapeJson(systemInstruction)
            + "\"}]},"
            + "\"contents\":[{\"role\":\"user\",\"parts\":["
            + "{\"text\":\""
            + escapeJson(userPrompt)
            + "\"},"
            + "{\"inline_data\":{\"mime_type\":\""
            + mimeType
            + "\",\"data\":\""
            + base64Image
            + "\"}}"
            + "]}],"
            + "\"generationConfig\":{\"responseMimeType\":\"application/json\",\"temperature\":0.2}"
            + "}";

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(30))
            .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new RuntimeException("Gemini Vision API error: " + response.statusCode());
    }

    JsonNode root = objectMapper.readTree(response.body());
    JsonNode textNode =
        root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
    if (textNode.isMissingNode()) {
      throw new RuntimeException("No text in Gemini Vision response");
    }

    String jsonText = textNode.asText().trim();
    JsonNode parsed = objectMapper.readTree(jsonText);

    String dishName = parsed.path("dishName").asText("Refeição Identificada");
    String confidence = parsed.path("confidence").asText("HIGH");
    BigDecimal totalCalories =
        BigDecimal.valueOf(parsed.path("totalCalories").asDouble(450.0))
            .setScale(1, RoundingMode.HALF_UP);
    BigDecimal proteins =
        BigDecimal.valueOf(parsed.path("proteins").asDouble(30.0))
            .setScale(1, RoundingMode.HALF_UP);
    BigDecimal carbohydrates =
        BigDecimal.valueOf(parsed.path("carbohydrates").asDouble(45.0))
            .setScale(1, RoundingMode.HALF_UP);
    BigDecimal fats =
        BigDecimal.valueOf(parsed.path("fats").asDouble(12.0)).setScale(1, RoundingMode.HALF_UP);
    BigDecimal fibers =
        BigDecimal.valueOf(parsed.path("fibers").asDouble(5.0)).setScale(1, RoundingMode.HALF_UP);
    BigDecimal sodium =
        BigDecimal.valueOf(parsed.path("sodium").asDouble(350.0)).setScale(1, RoundingMode.HALF_UP);
    String nutritionNotes =
        parsed
            .path("nutritionNotes")
            .asText("Refeição balanceada identificada por inteligência artificial.");

    List<FoodItemIdentified> items = new ArrayList<>();
    JsonNode itemsNode = parsed.path("items");
    if (itemsNode.isArray()) {
      for (JsonNode item : itemsNode) {
        items.add(
            new FoodItemIdentified(
                item.path("name").asText("Alimento"),
                item.path("portion").asText("1 porção"),
                BigDecimal.valueOf(item.path("calories").asDouble(100.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("proteins").asDouble(5.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("carbohydrates").asDouble(10.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("fats").asDouble(2.0))
                    .setScale(1, RoundingMode.HALF_UP)));
      }
    }

    if (items.isEmpty()) {
      items.add(
          new FoodItemIdentified(
              dishName, "1 prato", totalCalories, proteins, carbohydrates, fats));
    }

    AnalyzeMealPhotoResponse photoResp =
        new AnalyzeMealPhotoResponse(
            dishName,
            confidence,
            photoUrl,
            totalCalories,
            proteins,
            carbohydrates,
            fats,
            fibers,
            sodium,
            items,
            nutritionNotes);

    JsonNode usage = root.path("usageMetadata");
    int promptTokens = usage.path("promptTokenCount").asInt(260);
    int completionTokens = usage.path("candidatesTokenCount").asInt(280);
    int totalTokens = usage.path("totalTokenCount").asInt(540);

    return new GeminiVisionResult(photoResp, promptTokens, completionTokens, totalTokens);
  }

  private AnalyzeMealPhotoResponse fallbackLocalFoodVision(
      String mealTypeHint, String notesHint, String photoUrl) {
    String meal =
        (mealTypeHint != null && !mealTypeHint.isBlank()) ? mealTypeHint : "Almoço Saudável";
    List<FoodItemIdentified> items =
        List.of(
            new FoodItemIdentified(
                "Proteína Grelhada / Magra",
                "150g",
                BigDecimal.valueOf(240.0),
                BigDecimal.valueOf(32.0),
                BigDecimal.ZERO,
                BigDecimal.valueOf(5.0)),
            new FoodItemIdentified(
                "Carboidrato Complexo (Arroz/Batata)",
                "120g",
                BigDecimal.valueOf(160.0),
                BigDecimal.valueOf(3.0),
                BigDecimal.valueOf(35.0),
                BigDecimal.valueOf(0.5)),
            new FoodItemIdentified(
                "Leguminosa / Vegetais Variados",
                "100g",
                BigDecimal.valueOf(80.0),
                BigDecimal.valueOf(4.0),
                BigDecimal.valueOf(12.0),
                BigDecimal.valueOf(1.0)));

    return new AnalyzeMealPhotoResponse(
        meal + " Balanceado",
        "MEDIUM",
        photoUrl,
        BigDecimal.valueOf(480.0),
        BigDecimal.valueOf(39.0),
        BigDecimal.valueOf(47.0),
        BigDecimal.valueOf(6.5),
        BigDecimal.valueOf(5.5),
        BigDecimal.valueOf(360.0),
        items,
        "Estimativa gerada pelo motor nutricional local de contingência GeLu.");
  }

  @Transactional
  public MealLogResponse saveMealLog(UUID userId, CreateMealLogRequest request) {
    if (userId == null) {
      throw new BadRequestException("Usuário não autenticado");
    }

    if (request.dishName() == null || request.dishName().isBlank()) {
      throw new BadRequestException("Nome do prato ou refeição é obrigatório");
    }

    UUID familyId = null;
    List<Family> families = familyRepository.findAllByMemberUserId(userId);
    if (!families.isEmpty()) {
      familyId = families.get(0).getId();
    }

    String itemsJson = null;
    if (request.items() != null && !request.items().isEmpty()) {
      try {
        itemsJson = objectMapper.writeValueAsString(request.items());
      } catch (Exception ignored) {
      }
    }

    LocalDateTime consumedAt =
        request.consumedAt() != null ? request.consumedAt() : LocalDateTime.now();

    MealLog log =
        new MealLog(
            userId,
            familyId,
            request.mealType() != null ? request.mealType() : "OTHER",
            request.dishName().trim(),
            request.photoUrl(),
            request.totalCalories(),
            request.proteins(),
            request.carbohydrates(),
            request.fats(),
            request.fibers(),
            request.sodium(),
            itemsJson,
            request.aiNotes(),
            consumedAt);

    MealLog saved = mealLogRepository.save(log);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<MealLogResponse> listMealLogs(UUID userId, LocalDate date) {
    LocalDate targetDate = date != null ? date : LocalDate.now();
    LocalDateTime start = targetDate.atStartOfDay();
    LocalDateTime end = targetDate.plusDays(1).atStartOfDay().minusNanos(1);

    return mealLogRepository
        .findAllByUserIdAndConsumedAtBetweenOrderByConsumedAtDesc(userId, start, end)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public DailyMealSummaryResponse getDailySummary(UUID userId, LocalDate date) {
    List<MealLogResponse> meals = listMealLogs(userId, date);

    BigDecimal totalCalories = BigDecimal.ZERO;
    BigDecimal totalProteins = BigDecimal.ZERO;
    BigDecimal totalCarbohydrates = BigDecimal.ZERO;
    BigDecimal totalFats = BigDecimal.ZERO;
    BigDecimal totalFibers = BigDecimal.ZERO;
    BigDecimal totalSodium = BigDecimal.ZERO;

    for (MealLogResponse m : meals) {
      totalCalories = totalCalories.add(m.totalCalories());
      totalProteins = totalProteins.add(m.proteins());
      totalCarbohydrates = totalCarbohydrates.add(m.carbohydrates());
      totalFats = totalFats.add(m.fats());
      if (m.fibers() != null) totalFibers = totalFibers.add(m.fibers());
      if (m.sodium() != null) totalSodium = totalSodium.add(m.sodium());
    }

    return new DailyMealSummaryResponse(
        date != null ? date : LocalDate.now(),
        totalCalories.setScale(1, RoundingMode.HALF_UP),
        totalProteins.setScale(1, RoundingMode.HALF_UP),
        totalCarbohydrates.setScale(1, RoundingMode.HALF_UP),
        totalFats.setScale(1, RoundingMode.HALF_UP),
        totalFibers.setScale(1, RoundingMode.HALF_UP),
        totalSodium.setScale(1, RoundingMode.HALF_UP),
        meals.size(),
        meals);
  }

  @Transactional
  public void deleteMealLog(UUID userId, UUID mealLogId) {
    MealLog meal =
        mealLogRepository
            .findById(mealLogId)
            .orElseThrow(() -> new NotFoundException("Registro de refeição não encontrado"));

    if (!meal.getUserId().equals(userId)) {
      throw new BadRequestException("Você não tem permissão para excluir esta refeição");
    }

    mealLogRepository.delete(meal);
  }

  private MealLogResponse toResponse(MealLog entity) {
    List<FoodItemIdentified> items = new ArrayList<>();
    if (entity.getItemsJson() != null && !entity.getItemsJson().isBlank()) {
      try {
        items =
            objectMapper.readValue(
                entity.getItemsJson(), new TypeReference<List<FoodItemIdentified>>() {});
      } catch (Exception ignored) {
      }
    }

    return new MealLogResponse(
        entity.getId(),
        entity.getUserId(),
        entity.getFamilyId(),
        entity.getMealType(),
        entity.getDishName(),
        entity.getPhotoUrl(),
        entity.getTotalCalories(),
        entity.getProteins(),
        entity.getCarbohydrates(),
        entity.getFats(),
        entity.getFibers(),
        entity.getSodium(),
        items,
        entity.getAiNotes(),
        entity.getConsumedAt(),
        entity.getCreatedAt());
  }

  private String escapeJson(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\b", "\\b")
        .replace("\f", "\\f")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }

  private static class GeminiVisionResult {
    final AnalyzeMealPhotoResponse response;
    final int promptTokens;
    final int completionTokens;
    final int totalTokens;

    GeminiVisionResult(
        AnalyzeMealPhotoResponse response,
        int promptTokens,
        int completionTokens,
        int totalTokens) {
      this.response = response;
      this.promptTokens = promptTokens;
      this.completionTokens = completionTokens;
      this.totalTokens = totalTokens;
    }
  }
}
